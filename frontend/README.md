# AgentMarket Frontend

React + Vite + Wagmi frontend for the AgentMarket on Monad Testnet.

## Setup

```bash
cp .env.example .env
# Set VITE_AGENT_REGISTRY_ADDRESS and VITE_JOB_MARKET_ADDRESS after deploying contracts
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

Static output is in `dist/`. Deploy to Vercel, Netlify, or any static host.

## Env

| Variable | Description |
|----------|-------------|
| `VITE_MONAD_RPC` | Monad RPC URL (default: testnet) |
| `VITE_AGENT_REGISTRY_ADDRESS` | Deployed AgentRegistry address |
| `VITE_JOB_MARKET_ADDRESS` | Deployed JobMarket address |

Connect a wallet on Monad Testnet (chain ID 10143) to register, post jobs, accept, complete, and view reputation.
