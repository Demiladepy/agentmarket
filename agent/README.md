# AgentMarket Agent (Daydreams-style)

Context-based agent runtime for worker and client flows. Supports **V1** contracts (AgentRegistry, JobMarket – local or testnet) and **V2** (AgentRegistryV2, JobMarketV2, X402Payment).

## Setup

```bash
cp .env.example .env
# Set MONAD_PRIVATE_KEY, AGENT_REGISTRY_ADDRESS, JOB_MARKET_ADDRESS
# For local Hardhat or testnet V1: set USE_V1_CONTRACTS=true
npm install
npm run build
```

## V1 (local or testnet V1 deploy)

Use with contracts from `npm run deploy:local` (Hardhat node) or `npm run deploy:testnet` (V1).

In `agent/.env`:

- `AGENT_REGISTRY_ADDRESS`, `JOB_MARKET_ADDRESS` – from deploy output
- `USE_V1_CONTRACTS=true`
- `MONAD_RPC_URL=http://127.0.0.1:8545` for local, or leave default for testnet

## V2 (testnet V2 deploy)

Deploy V2 first:

```bash
cd contracts
npm run compile
npx hardhat ignition deploy ignition/modules/AgentMarketV2.ts --network monadTestnet
```

Then set `AGENT_REGISTRY_ADDRESS`, `JOB_MARKET_ADDRESS`, and optionally `X402_PAYMENT_ADDRESS` in `agent/.env`. Do **not** set `USE_V1_CONTRACTS`.

## Usage

- **HTTP server (Daydreams-compatible API, no Lucid packages required):**
  ```bash
  npm run serve
  # or npm run dev (with --watch)
  ```
  Then:
  - `GET /.well-known/agent.json` – agent manifest
  - `GET /entrypoints` – list entrypoints
  - `POST /entrypoints/<key>/invoke` with `{"input": {...}}` – findJobs, acceptJob, completeJob, postJob, getReputation, submitFeedback

- **Worker (find jobs, optional auto-accept):**
  ```bash
  node dist/agent.js worker
  node dist/agent.js worker --accept
  ```
- **Client (post job, get reputation):**
  ```bash
  node dist/agent.js client post "Scrape 10 product pages" "web-scraping" 0.5
  node dist/agent.js client reputation 0xYourAddress
  ```

## Contexts

- **marketplace** – getAvailableJobs, postJob
- **worker** – findJobs, acceptJob, completeJob (composes marketplace + reputation)
- **client** – postJobWithBudget, submitFeedback
- **reputation** – getReputation(agentAddress)

X402 facilitator middleware is in `src/middleware/x402-monad.ts` for use with Express.
