import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { localhost, monadTestnet } from "./chains";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

function bootstrap() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  const queryClient = new QueryClient();
  let config;
  try {
    config = createConfig({
      chains: [localhost, monadTestnet],
      connectors: [injected()],
      transports: {
        [localhost.id]: http(import.meta.env.VITE_LOCAL_RPC || "http://127.0.0.1:8545"),
        [monadTestnet.id]: http(import.meta.env.VITE_MONAD_RPC || "https://testnet-rpc.monad.xyz"),
      },
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    rootEl.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,sans-serif;background:#0a0a0d;color:#f4f4f6;">
        <h1 style="font-size:1.25rem;margin-bottom:0.5rem;">Config error</h1>
        <pre style="max-width:min(90vw,640px);min-height:4rem;overflow:auto;padding:1rem;background:#16161e;border-radius:8px;font-size:0.875rem;color:#ef4444;text-align:left;white-space:pre-wrap;word-break:break-word;">${err.message}</pre>
      </div>
    `;
    return;
  }

  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <BrowserRouter>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </WagmiProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

bootstrap();
