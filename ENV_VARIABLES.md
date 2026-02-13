# AgentMarket – Env variables and where to find them

Use this as a checklist. Create `.env` in each folder from the relevant section (copy from `.env.example` if present).

---

## API keys (optional – you don’t need any to run the app)

| API key | Used by | When you need it | Where to get it |
|---------|---------|-------------------|-----------------|
| **ETHERSCAN_API_KEY** | Contracts (Hardhat verify) | Only if you verify contracts on the block explorer after deploy | Block explorer’s site: e.g. [MonadVision testnet](https://testnet.monadvision.com/) → look for “API keys” / “Developer” / “Verify contract”; or [BlockVision](https://www.blockvision.org/) if that’s what your chain uses. |
| **PINATA_API_KEY** / **PINATA_API_SECRET** / **PINATA_JWT** | Agent (optional) | Only if you use Pinata for IPFS (e.g. metadata URIs) | [Pinata](https://app.pinata.cloud/) → API keys. JWT is used for uploads. Not required for core marketplace. |

No other API keys are used. RPC URLs are public; contract addresses come from your deploy; private keys come from your wallet.

---

## Contracts (`contracts/.env`)

| Variable | Where to find it |
|----------|-------------------|
| **PRIVATE_KEY** | **Your wallet.** Export from [MetaMask](https://metamask.io/) (Account details → Export private key) or any wallet. For **local only** you can leave unset (Hardhat default account is used). Never share or commit. |
| **MONAD_TESTNET_RPC** | Default: `https://testnet-rpc.monad.xyz` — [Monad testnet RPC](https://docs.monad.xyz/reference/rpc-endpoints). Override only if you use another provider. |
| **MONAD_MAINNET_RPC** | Default: `https://rpc.monad.xyz` — [Monad mainnet RPC](https://docs.monad.xyz/reference/rpc-endpoints). |
| **ETHERSCAN_API_KEY** | Optional. For contract verification: [MonadVision / BlockVision](https://testnet.monadvision.com/) or your block explorer’s “API keys” / developer section. |

---

## Frontend (`frontend/.env`)

| Variable | Where to find it |
|----------|-------------------|
| **VITE_AGENT_REGISTRY_ADDRESS** | **From your deploy.** After running `npm run deploy:local` or `deploy:testnet` in `contracts/`, copy the printed `AgentMarketModule#AgentRegistry` address. Or run `npm run addresses` in `contracts/` and copy the line. Not available “online” until you deploy. |
| **VITE_JOB_MARKET_ADDRESS** | **From your deploy.** Same as above; use the printed `AgentMarketModule#JobMarket` address or the line from `npm run addresses`. |
| **VITE_LOCAL_RPC** | Local only: `http://127.0.0.1:8545` (your machine; no signup). |
| **VITE_MONAD_RPC** | Default: `https://testnet-rpc.monad.xyz` — [Monad testnet RPC](https://docs.monad.xyz/reference/rpc-endpoints). |

---

## Agent (`agent/.env`)

| Variable | Where to find it |
|----------|-------------------|
| **MONAD_PRIVATE_KEY** | **Your wallet.** Same as PRIVATE_KEY — [MetaMask export](https://support.metamask.io/privacy-and-security/how-to-reveal-your-secret-recovery-phrase/) or your wallet’s “export private key”. |
| **AGENT_REGISTRY_ADDRESS** | **From your deploy.** Same value as `VITE_AGENT_REGISTRY_ADDRESS` (see Frontend). |
| **JOB_MARKET_ADDRESS** | **From your deploy.** Same value as `VITE_JOB_MARKET_ADDRESS` (see Frontend). |
| **MONAD_RPC_URL** | **Pick one:** Local: `http://127.0.0.1:8545` · Testnet: `https://testnet-rpc.monad.xyz` · Mainnet: `https://rpc.monad.xyz` — [Monad RPC docs](https://docs.monad.xyz/reference/rpc-endpoints). |
| **USE_V1_CONTRACTS** | Set to `true` for V1 contracts (local or testnet V1 deploy). |
| **WORKER_ADDRESS** | Optional. Your agent’s public address (0x…); same as the address of the wallet for `MONAD_PRIVATE_KEY`. |
| **WORKER_SKILLS** | Optional. Comma-separated list, e.g. `data-analysis,web-scraping`. |
| **X402_PAYMENT_ADDRESS** | Optional. Only for V2; from V2 deploy or leave default. |

---

## Worker (`worker/.env`)

| Variable | Where to find it |
|----------|-------------------|
| **AGENT_PRIVATE_KEY** | **Your wallet.** Same source as MONAD_PRIVATE_KEY — [MetaMask](https://metamask.io/) or your wallet’s export. |
| **JOB_MARKET_ADDRESS** | **From your deploy.** Same as Frontend/Agent (see above). |
| **MONAD_RPC** or **MONAD_TESTNET_RPC** | Same as Agent: `http://127.0.0.1:8545` (local) or `https://testnet-rpc.monad.xyz` — [Monad RPC](https://docs.monad.xyz/reference/rpc-endpoints). |

---

## Quick links (online sources)

| What | URL |
|------|-----|
| Monad RPC endpoints (testnet, mainnet) | https://docs.monad.xyz/reference/rpc-endpoints |
| Monad testnet RPC (public) | https://testnet-rpc.monad.xyz |
| Monad mainnet RPC (public) | https://rpc.monad.xyz |
| Monad testnet explorer | https://testnet.monadvision.com |
| MetaMask (wallet / export key) | https://metamask.io |
| Monad faucet (testnet MON) | https://faucet.monad.xyz or [DevNads agent faucet](https://agents.devnads.com) |

---

## Summary

- **Contract addresses** → You get them by deploying (`npm run deploy:local` or `deploy:testnet` in `contracts/`), then copy from terminal or `npm run addresses`.
- **Private keys** → From your wallet (e.g. MetaMask export); never get them from a website except your own wallet app.
- **RPC URLs** → Use the public URLs above; no signup. Local RPC is your own Hardhat node.
- **API keys** (e.g. ETHERSCAN) → From the block explorer’s developer/API section if you verify contracts.

---

## Status: API keys & env (what’s left)

**API keys:** There are **no other API keys** in this project. You’ve set:
- **ETHERSCAN_API_KEY** (contracts) ✓  
- **Pinata** (agent): PINATA_API_KEY, PINATA_API_SECRET, PINATA_JWT ✓  

Anything else (e.g. Supabase, GitHub) is commented-out optional and not used.

**Env variables – local only (no MON / no testnet):**  
Since you’re pausing testnet deploy (no MON), use **local Hardhat** only. No MON or faucet needed.

| Where | What’s left |
|-------|------------------|
| **contracts** | Nothing. For local, PRIVATE_KEY can stay unset; ETHERSCAN_API_KEY is set. |
| **frontend** | **VITE_AGENT_REGISTRY_ADDRESS** and **VITE_JOB_MARKET_ADDRESS.** Fill these **after** you run `npm run deploy:local` in `contracts/` (with `npx hardhat node` running). Then run `npm run addresses` in `contracts/` and copy the two printed lines into `frontend/.env`. |
| **agent** | Already set for local (addresses, MONAD_RPC_URL=http://127.0.0.1:8545, USE_V1_CONTRACTS=true). No change unless you use a different wallet key. |
| **worker** | If you use the worker CLI/daemon: create `worker/.env` with **AGENT_PRIVATE_KEY** (your wallet), **JOB_MARKET_ADDRESS** (same as frontend/agent, from deploy:local), and **MONAD_RPC**=`http://127.0.0.1:8545`. |

**TL;DR:** No other API keys. For local, the only thing “left” is putting the **two contract addresses** into **frontend/.env** (and worker/.env if you use it) after you run **deploy:local** (no MON required).
