# AgentMarket Smart Contracts (Monad)

Solidity contracts for the AgentMarket: **AgentRegistry**, **Escrow**, and **JobMarket**.

**Monad development rule:** The project rule in `.cursor/rules/monad-development.mdc` recommends **Foundry** (not Hardhat) for new Monad work and the **verification API** (https://agents.devnads.com/v1/verify) for contract verification so all explorers get verified with one call. This repo currently uses Hardhat; for new Monad-only contracts consider Foundry and that API.

## Requirements

- Node.js 18+
- For Monad: set `evmVersion: "prague"` (already in `hardhat.config.ts`)

## Setup

```bash
cp .env.example .env
# Edit .env and set PRIVATE_KEY (and optionally MONAD_TESTNET_RPC)
npm install
```

Keep `PRIVATE_KEY` only in `.env` (do not commit). If you generate a new wallet, persist it here or in `~/.monad-wallet`; see root README and `.cursor/rules/monad-development.mdc` for faucet and wallet rules.

## Build

```bash
npm run compile
```

## Test

```bash
npm test
```

## Deploy

- **Local Hardhat node (no testnet tokens):** In one terminal run `npx hardhat node`. In another: `npm run deploy:local`. Uses network `localhost` (http://127.0.0.1:8545, chain ID 31337). Save the printed addresses for `frontend/.env` and `agent/.env`; point RPC to `http://127.0.0.1:8545` for local.
- **Monad Testnet:** `npm run deploy:testnet` (when you have testnet MON).
- **Monad Mainnet:** `npm run deploy:mainnet`

After deployment, save the printed addresses (AgentRegistry, Escrow, JobMarket) for the frontend and worker.

### V2 contracts (payment-weighted reputation, X402)

To deploy AgentRegistryV2, JobMarketV2, and X402Payment:

```bash
npx hardhat ignition deploy ignition/modules/AgentMarketV2.ts --network monadTestnet
# Optionally pass facilitator address: --parameters '{"AgentMarketV2Module":{"facilitatorAddress":"0x..."}}'
```

Use the printed addresses in the `agent/` package (see `agent/README.md`).
