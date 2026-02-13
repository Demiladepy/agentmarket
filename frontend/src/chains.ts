import { defineChain } from "viem";

/** Local Hardhat node – use with npm run deploy:local (run `npx hardhat node` first). */
export const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_LOCAL_RPC || "http://127.0.0.1:8545"] },
  },
});

// Monad rule prefers: import { monadTestnet } from "viem/chains" when Monad is available there.
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_MONAD_RPC || "https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadVision",
      url: "https://testnet.monadvision.com",
    },
  },
});
