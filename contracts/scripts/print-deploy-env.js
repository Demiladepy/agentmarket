#!/usr/bin/env node
/**
 * Print env vars for agent and frontend from the last Hardhat Ignition deploy.
 * Usage: node scripts/print-deploy-env.js [chainId]
 * Default chainId: 31337 (localhost)
 * Example: node scripts/print-deploy-env.js 10143
 */
const fs = require("fs");
const path = require("path");

const chainId = process.argv[2] || "31337";
const deployDir = path.join(__dirname, "..", "ignition", "deployments", `chain-${chainId}`);
const addressesPath = path.join(deployDir, "deployed_addresses.json");

if (!fs.existsSync(addressesPath)) {
  console.error(`No deployment found at ${addressesPath}`);
  console.error("Run: npm run deploy:local (or deploy:testnet) first.");
  process.exit(1);
}

const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
const registry = addresses["AgentMarketModule#AgentRegistry"];
const jobMarket = addresses["AgentMarketModule#JobMarket"];
const escrow = addresses["AgentMarketModule#Escrow"];

if (!registry || !jobMarket) {
  console.error("Deployed addresses missing AgentRegistry or JobMarket.");
  process.exit(1);
}

console.log("# Copy these into agent/.env");
console.log(`AGENT_REGISTRY_ADDRESS=${registry}`);
console.log(`JOB_MARKET_ADDRESS=${jobMarket}`);
if (escrow) console.log(`# ESCROW_ADDRESS=${escrow}`);
console.log("");
console.log("# Copy these into frontend/.env");
console.log(`VITE_AGENT_REGISTRY_ADDRESS=${registry}`);
console.log(`VITE_JOB_MARKET_ADDRESS=${jobMarket}`);
console.log("");
console.log("# For local (chainId 31337) also set in agent/.env:");
console.log("MONAD_RPC_URL=http://127.0.0.1:8545");
console.log("USE_V1_CONTRACTS=true");
