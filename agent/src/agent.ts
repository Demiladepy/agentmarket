import "dotenv/config";
import { createMonadProvider } from "./providers/monad.provider.js";
import { createMarketplaceContext } from "./contexts/marketplace.context.js";
import { createReputationContext } from "./contexts/reputation.context.js";
import { createWorkerContext } from "./contexts/worker.context.js";
import { createClientContext } from "./contexts/client.context.js";

const rpcUrl = process.env.MONAD_RPC_URL || process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const privateKey = process.env.MONAD_PRIVATE_KEY!;
const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS!;
const jobMarketAddress = process.env.JOB_MARKET_ADDRESS!;
const x402PaymentAddress = process.env.X402_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";
const useV1 = process.env.USE_V1_CONTRACTS === "true";

if (!privateKey || !agentRegistryAddress || !jobMarketAddress) {
  console.error("Set MONAD_PRIVATE_KEY, AGENT_REGISTRY_ADDRESS, JOB_MARKET_ADDRESS in .env");
  process.exit(1);
}

const monad = createMonadProvider({
  rpcUrl,
  privateKey,
  agentRegistryAddress,
  jobMarketAddress,
  x402PaymentAddress,
  useV1,
});

const marketplace = createMarketplaceContext(monad);
const reputation = createReputationContext(monad);
const worker = createWorkerContext(monad, marketplace, reputation);
const client = createClientContext(monad, marketplace);

const mode = process.argv[2] || "worker";

if (mode === "worker") {
  const agentAddress = process.env.WORKER_ADDRESS || monad.wallet.address;
  const skills = (process.env.WORKER_SKILLS || "data-analysis,web-scraping").split(",").map((s) => s.trim());
  const minPayment = Number(process.env.WORKER_MIN_PAYMENT || "0.01");
  worker.setConfig({ agentAddress, skills, minPayment });
  const result = await worker.findJobs({ autoAccept: process.argv.includes("--accept") });
  console.log(JSON.stringify(result, null, 2));
} else if (mode === "client") {
  client.setConfig({
    clientAddress: process.env.CLIENT_ADDRESS || monad.wallet.address,
    budget: Number(process.env.CLIENT_BUDGET || "10"),
  });
  const [, , cmd, ...args] = process.argv;
  if (cmd === "post" && args.length >= 3) {
    const [description, skills, payment] = args;
    const result = await client.postJobWithBudget({
      description,
      skillsRequired: skills,
      payment: Number(payment),
    });
    console.log(JSON.stringify(result, null, 2));
  } else if (cmd === "reputation" && args[0]) {
    const rep = await reputation.getReputation(args[0]);
    console.log(JSON.stringify(rep, null, 2));
  } else {
    console.log("Usage: node agent.js client post <description> <skills> <payment>");
    console.log("       node agent.js client reputation <address>");
  }
} else {
  console.log("Usage: node agent.js worker [--accept]");
  console.log("       node agent.js client post <description> <skills> <payment>");
  console.log("       node agent.js client reputation <address>");
}
