import { ethers } from "ethers";

const X402_ABI = [
  "function processPayment(bytes32 paymentId, address from, address to, uint256 amount, bytes32 jobId) external",
  "function verifyPayment(bytes32 paymentId) external view returns (bool)",
];

export interface X402MonadOptions {
  contractAddress: string;
  rpcUrl: string;
  facilitatorKey: string;
}

export function x402MonadFacilitator(options: X402MonadOptions) {
  const provider = new ethers.JsonRpcProvider(options.rpcUrl);
  const facilitator = new ethers.Wallet(options.facilitatorKey, provider);
  const contract = new ethers.Contract(options.contractAddress, X402_ABI, facilitator);

  return async (req: any, res: any, next: () => void) => {
    const paymentHeader = req.headers["x-payment-proof"];
    if (!paymentHeader) {
      res.status(402).json({
        error: "Payment Required",
        paymentAddress: options.contractAddress,
        amount: "0.01",
        chain: "monad",
        message: "Please send payment to continue",
      });
      return;
    }
    try {
      const payment = JSON.parse(paymentHeader as string);
      const isValid = await contract.verifyPayment(payment.id);
      if (!isValid) {
        res.status(402).json({ error: "Invalid payment" });
        return;
      }
      const jobId = ethers.id("job-" + Date.now() + "-" + Math.random());
      const tx = await contract.processPayment(
        payment.id,
        payment.from,
        payment.to,
        payment.amount,
        jobId
      );
      await tx.wait();
      res.setHeader("X-Job-Id", jobId);
      res.setHeader("X-Payment-Verified", "true");
      req.payment = payment;
      req.jobId = jobId;
      next();
    } catch (err) {
      console.error("Payment verification failed:", err);
      res.status(402).json({ error: "Payment verification failed" });
    }
  };
}
