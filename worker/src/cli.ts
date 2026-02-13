#!/usr/bin/env node
import "dotenv/config";
import { createClients, scanJobs, acceptJob, completeJob, autoWorkLoop } from "./agent-worker.js";

const RPC = process.env.MONAD_RPC || process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const PK = process.env.AGENT_PRIVATE_KEY;
const JOB_MARKET = process.env.JOB_MARKET_ADDRESS as `0x${string}`;

if (!PK || !JOB_MARKET) {
  console.error("Set AGENT_PRIVATE_KEY and JOB_MARKET_ADDRESS in .env");
  process.exit(1);
}

const config = {
  rpcUrl: RPC,
  privateKey: PK.startsWith("0x") ? (PK as `0x${string}`) : (`0x${PK}` as `0x${string}`),
  jobMarketAddress: JOB_MARKET,
};

const args = process.argv.slice(2);
const cmd = args[0];

async function main() {
  const { publicClient, walletClient, jobMarketAddress } = createClients(config);

  if (cmd === "scan") {
    const skillFilter = args[1];
    const maxPayment = args[2] ? BigInt(args[2]) : undefined;
    const jobs = await scanJobs(publicClient, jobMarketAddress, { skillFilter, maxPayment });
    console.log(JSON.stringify(jobs, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
    return;
  }

  if (cmd === "accept") {
    const jobId = args[1] as `0x${string}`;
    if (!jobId) {
      console.error("Usage: node cli.js accept <jobId>");
      process.exit(1);
    }
    const hash = await acceptJob(walletClient!, jobMarketAddress, jobId);
    console.log("Tx hash:", hash);
    return;
  }

  if (cmd === "complete") {
    const jobId = args[1] as `0x${string}`;
    if (!jobId) {
      console.error("Usage: node cli.js complete <jobId>");
      process.exit(1);
    }
    const hash = await completeJob(walletClient!, jobMarketAddress, jobId);
    console.log("Tx hash:", hash);
    return;
  }

  if (cmd === "daemon") {
    const skillFilter = args[1];
    const maxPayment = args[2] ? BigInt(args[2]) : undefined;
    const intervalMs = args[3] ? parseInt(args[3], 10) : 30_000;
    console.log("Worker daemon: polling for jobs (skillFilter=%s, interval=%dms). Accept one job per cycle.", skillFilter || "any", intervalMs);
    for (;;) {
      await autoWorkLoop(config, { skillFilter, maxPayment, intervalMs });
      console.log("Accepted one job. Polling again…");
    }
  }

  console.error("Usage: node cli.js scan [skillFilter] [maxPayment] | accept <jobId> | complete <jobId> | daemon [skillFilter] [maxPayment] [intervalMs]");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
