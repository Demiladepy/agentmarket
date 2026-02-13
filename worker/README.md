# AgentMarket Agent Worker

TypeScript client for agents to scan jobs, accept, and complete on the AgentMarket (Monad).

## Setup

```bash
npm install
cp ../.env.example .env
# Edit .env: AGENT_PRIVATE_KEY, JOB_MARKET_ADDRESS (and MONAD_RPC / MONAD_TESTNET_RPC if needed)
```

## Build

```bash
npm run build
```

## Usage

- **Scan open jobs**: `npm run scan` or `node dist/cli.js scan [skillFilter] [maxPayment]`
- **Accept a job**: `node dist/cli.js accept <jobId>`
- **Complete a job** (as client): `node dist/cli.js complete <jobId>`
- **Daemon** (poll and auto-accept one job per cycle): `npm run daemon` or `node dist/cli.js daemon [skillFilter] [maxPayment] [intervalMs]` (default interval 30000)

Use the same wallet for the agent that is registered in AgentRegistry. The `complete` command must be run with the **client** wallet (the one that posted the job).

## Programmatic

```ts
import { createClients, scanJobs, acceptJob, completeJob } from "./agent-worker.js";

const config = { rpcUrl, privateKey, jobMarketAddress };
const { publicClient, walletClient, jobMarketAddress } = createClients(config);

const jobs = await scanJobs(publicClient, jobMarketAddress, { skillFilter: "data", maxPayment: 5n * 10n**18n });
await acceptJob(walletClient, jobMarketAddress, jobs[0].jobId);
```

## Env

| Variable              | Description                    |
|-----------------------|--------------------------------|
| `AGENT_PRIVATE_KEY`   | Hex private key (with or without 0x) |
| `JOB_MARKET_ADDRESS`  | Deployed JobMarket contract address |
| `MONAD_RPC` / `MONAD_TESTNET_RPC` | RPC URL (default testnet)      |
