# AgentMarket – Cross-check checklist

Use this to verify everything is wired correctly. Last full check: project-wide.

---

## Contracts

| Check | Status |
|-------|--------|
| **AgentMarket.ts** imports `buildModule` from `@nomicfoundation/hardhat-ignition/modules` (not hardhat-ignition-viem) | ✓ |
| **hardhat.config.ts** localhost uses mnemonic (`test test test test test test test test test test test junk`, count: 1) so deploy:local works without PRIVATE_KEY | ✓ |
| **JobMarket.sol** has postJob, acceptJob, completeJob, cancelJob, disputeJob, submitFeedback, getJob, getJobCount, getJobIdAt | ✓ |
| **Deploy script** `contracts/scripts/print-deploy-env.js` reads `AgentMarketModule#AgentRegistry` and `AgentMarketModule#JobMarket` from `ignition/deployments/chain-<id>/deployed_addresses.json` | ✓ |
| **package.json** has `addresses` script: `node scripts/print-deploy-env.js` | ✓ |

---

## Frontend

| Check | Status |
|-------|--------|
| **config.ts** treats only valid 0x+40 hex as address; "0x" or invalid length → undefined (no RPC to bad address) | ✓ |
| **abis.ts** AgentRegistry: registerAgent, updateAgent, getAgent, isRegistered | ✓ |
| **abis.ts** JobMarket: postJob, acceptJob, completeJob, submitFeedback, cancelJob, disputeJob, getJobCount, getJobIdAt, getJob | ✓ |
| **JobDetail.tsx** shows Accept (status 0, !isClient), Cancel (status 0, isClient), Complete + Dispute (status 1, isClient), Feedback (status 2, isClient) | ✓ |
| **PostJob.tsx** checks isRegistered (agentRegistry); if not registered, shows "Register as agent" link | ✓ |
| **main.tsx** wagmi config: localhost (31337), monadTestnet (10143); transports from VITE_LOCAL_RPC / VITE_MONAD_RPC | ✓ |
| **Chains** (chains.ts) localhost id 31337, monadTestnet 10143 | ✓ |

---

## Agent

| Check | Status |
|-------|--------|
| **server.ts** requires MONAD_PRIVATE_KEY, AGENT_REGISTRY_ADDRESS, JOB_MARKET_ADDRESS; optional X402_PAYMENT_ADDRESS, USE_V1_CONTRACTS | ✓ |
| **Entrypoints** findJobs, acceptJob, completeJob, postJob, getReputation, submitFeedback match OpenClaw plugin keys | ✓ |
| **postJob** input: description, skillsRequired, payment; getReputation: address; submitFeedback: jobId, rating, optional commentUri, proofOfPayment | ✓ |

---

## OpenClaw skill

| Check | Status |
|-------|--------|
| **Plugin** (agent-marketplace/index.ts) registers 6 tools: agentmarket_find_jobs → findJobs, accept_job → acceptJob, complete_job → completeJob, post_job → postJob, get_reputation → getReputation, submit_feedback → submitFeedback | ✓ |
| **invokeEntrypoint** POST `{baseUrl}/entrypoints/{key}/invoke` with body `{ input }` | ✓ |
| **Config** reads agentServerUrl from `plugins.entries.agentmarket.config.agentServerUrl`; default http://localhost:3000 | ✓ |

---

## Worker

| Check | Status |
|-------|--------|
| **worker abis** (worker/src/abis.ts) JobMarket: getJobCount, getJobIdAt, getJob, acceptJob, completeJob (no cancel/dispute needed for worker) | ✓ |
| **cli.ts** commands: scan, accept, complete, daemon (calls autoWorkLoop in a loop) | ✓ |
| **agent-worker.ts** autoWorkLoop scans, accepts one job, returns; daemon re-runs it | ✓ |

---

## Env & docs

| Check | Status |
|-------|--------|
| **.gitignore** includes .env, .env.local, .env.*.local | ✓ |
| **ENV_VARIABLES.md** lists all vars by folder, API keys, quick links, status (what’s left for local) | ✓ |
| **E2E_SETUP.md** steps 1–7: deploy local, agent .env, serve agent, copy skill, OpenClaw config, restart gateway, test | ✓ |
| **supabase/** no DB required; README says on-chain only | ✓ |

---

## Optional / when you have MON

| Check | Status |
|-------|--------|
| Testnet deploy: set PRIVATE_KEY in contracts/.env, run deploy:testnet; update frontend + agent .env with new addresses and testnet RPC | ✓ doc’d |
| Contract verification: ETHERSCAN_API_KEY in contracts/.env; run hardhat verify --network monadTestnet ... | ✓ doc’d |

---

## Quick run (local)

1. `cd contracts && npx hardhat node` (leave running)
2. `cd contracts && npm run deploy:local`
3. `cd contracts && npm run addresses` → copy lines into `frontend/.env` and `agent/.env`
4. In agent/.env ensure MONAD_RPC_URL=http://127.0.0.1:8545, USE_V1_CONTRACTS=true
5. `cd frontend && npm run dev` — connect wallet, Add Localhost
6. `cd agent && npm run build && npm run serve` (optional, for OpenClaw)

Frontend addresses must be full 0x+40 hex; "0x" alone is correctly ignored (config.ts).
