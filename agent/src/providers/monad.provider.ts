import { ethers } from "ethers";

// V2 contracts (AgentRegistryV2, JobMarketV2, X402Payment)
const AGENT_REGISTRY_V2_ABI = [
  "function registerAgent(string memory metadataUri) external",
  "function autoCreateAgent(address agentAddress) external",
  "function getAgent(address agentAddress) external view returns (tuple(address wallet, string metadataUri, bool active, bool autoCreated, uint128 totalWeightedRating, uint128 totalWeight, uint32 avgRating, uint64 createdAt, uint64 lastUpdate))",
  "function isRegistered(address account) external view returns (bool)",
];
const JOB_MARKET_V2_ABI = [
  "function postJob(string memory description, string memory skillsRequired, uint256 payment) external payable returns (bytes32)",
  "function acceptJob(bytes32 jobId) external",
  "function completeJob(bytes32 jobId, string memory deliverableUri) external",
  "function submitFeedback(bytes32 jobId, uint8 rating, string memory commentUri, bytes32 proofOfPayment) external",
  "function cancelJob(bytes32 jobId) external",
  "function getJob(bytes32 jobId) external view returns (tuple(bytes32 jobId, address client, address agent, string description, string skillsRequired, uint256 payment, uint8 status, uint64 postedAt, uint64 acceptedAt, uint64 completedAt, string deliverableUri))",
  "function getJobCount() external view returns (uint256)",
  "function getJobIdAt(uint256 index) external view returns (bytes32)",
];
const X402_ABI = [
  "function processPayment(bytes32 paymentId, address from, address to, uint256 amount, bytes32 jobId) external",
  "function verifyPayment(bytes32 paymentId) external view returns (bool)",
];

// V1 contracts (AgentRegistry, JobMarket – no X402, no skills/deliverableUri)
const AGENT_REGISTRY_V1_ABI = [
  "function registerAgent(string memory metadataUri) external",
  "function getAgent(address agentAddress) external view returns (tuple(address wallet, string metadataUri, uint256 avgRating, uint256 totalRatings, uint256 totalJobs, uint256 totalEarned, bool active))",
  "function isRegistered(address account) external view returns (bool)",
];
const JOB_MARKET_V1_ABI = [
  "function postJob(string memory taskDescription, uint256 payment) external payable",
  "function acceptJob(bytes32 jobId) external",
  "function completeJob(bytes32 jobId) external",
  "function submitFeedback(bytes32 jobId, uint8 rating) external",
  "function cancelJob(bytes32 jobId) external",
  "function getJob(bytes32 jobId) external view returns (tuple(address client, address agent, string taskDescription, uint256 payment, uint8 status))",
  "function getJobCount() external view returns (uint256)",
  "function getJobIdAt(uint256 index) external view returns (bytes32)",
];

export type MonadConfig = {
  rpcUrl: string;
  privateKey: string;
  agentRegistryAddress: string;
  jobMarketAddress: string;
  x402PaymentAddress: string;
  /** Set to "true" to use V1 contracts (local Hardhat or testnet V1 deploy). Default is V2. */
  useV1?: boolean;
};

export function createMonadProvider(config: MonadConfig) {
  const useV1 = config.useV1 === true;
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  const agentRegistry = new ethers.Contract(
    config.agentRegistryAddress,
    useV1 ? AGENT_REGISTRY_V1_ABI : AGENT_REGISTRY_V2_ABI,
    wallet
  );
  const jobMarket = new ethers.Contract(
    config.jobMarketAddress,
    useV1 ? JOB_MARKET_V1_ABI : JOB_MARKET_V2_ABI,
    wallet
  );
  const x402Payment = new ethers.Contract(config.x402PaymentAddress, X402_ABI, wallet);

  return {
    wallet,
    provider,
    agentRegistry,
    jobMarket,
    x402Payment,
    isV1: useV1,
    async getContract(name: "AgentRegistry" | "JobMarket" | "X402Payment") {
      if (name === "AgentRegistry") return agentRegistry;
      if (name === "JobMarket") return jobMarket;
      return x402Payment;
    },
    async registerAgent(metadataUri: string) {
      const tx = await agentRegistry.registerAgent(metadataUri);
      return await tx.wait();
    },
    async getBalance(address: string) {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    },
  };
}
