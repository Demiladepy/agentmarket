import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { localhost, monadTestnet } from "./chains";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [localhost, monadTestnet],
  connectors: [injected()],
  transports: {
    [localhost.id]: http(import.meta.env.VITE_LOCAL_RPC || "http://127.0.0.1:8545"),
    [monadTestnet.id]: http(import.meta.env.VITE_MONAD_RPC || "https://testnet-rpc.monad.xyz"),
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
