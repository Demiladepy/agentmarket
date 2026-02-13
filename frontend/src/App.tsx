import { useConnect, useAccount, useSwitchChain } from "wagmi";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Home } from "./pages/Home";
import { Jobs } from "./pages/Jobs";
import { PostJob } from "./pages/PostJob";
import { Register } from "./pages/Register";
import { Reputation } from "./pages/Reputation";
import { JobDetail } from "./pages/JobDetail";
import { AgentProfile } from "./pages/AgentProfile";
import { Dashboard } from "./pages/Dashboard";
import { ToastProvider, ToastContainer } from "./contexts/ToastContext";
import { ErrorBoundary } from "./ErrorBoundary";

function Nav() {
  const location = useLocation();
  const path = location.pathname;
  return (
    <nav className="nav-links">
      <Link to="/" className={path === "/" ? "active" : ""}>Discover</Link>
      <Link to="/jobs" className={path === "/jobs" ? "active" : ""}>Jobs</Link>
      <Link to="/dashboard" className={path === "/dashboard" ? "active" : ""}>Dashboard</Link>
      <Link to="/post" className={path === "/post" ? "active" : ""}>Post job</Link>
      <Link to="/register" className={path === "/register" ? "active" : ""}>Register</Link>
      <Link to="/reputation" className={path === "/reputation" ? "active" : ""}>Reputation</Link>
    </nav>
  );
}

const LOCALHOST = {
  chainId: "0x7A69" as const, // 31337
  chainName: "Localhost",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["http://127.0.0.1:8545"],
};

const MONAD_TESTNET = {
  chainId: "0x279F" as const,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadvision.com"],
};

function addChain(chain: typeof LOCALHOST | typeof MONAD_TESTNET) {
  const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!ethereum) {
    alert("No wallet found. Install MetaMask or another Web3 wallet.");
    return;
  }
  ethereum.request({ method: "wallet_addEthereumChain", params: [chain] }).catch((e: unknown) => console.error("Add chain failed:", e));
}

function ConnectWallet() {
  const { connect, connectors, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => switchChain?.({ chainId: 31337 })}
        >
          Localhost
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => switchChain?.({ chainId: 10143 })}
        >
          Monad Testnet
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => addChain(LOCALHOST)}>
          Add Localhost
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => addChain(MONAD_TESTNET)}>
          Add Testnet
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          const connector = connectors?.[0];
          if (connector) connect({ connector });
        }}
        disabled={isPending || !connectors?.length}
      >
        {isPending ? "Connecting…" : connectors?.length ? "Connect wallet" : "No wallet detected"}
      </button>
      <button type="button" className="btn btn--ghost" onClick={() => addChain(LOCALHOST)}>
        Add Localhost
      </button>
      <button type="button" className="btn btn--ghost" onClick={() => addChain(MONAD_TESTNET)}>
        Add Testnet
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <header className="nav-top">
        <ul>
          <li>
            <Link to="/" className="nav-brand">AgentMarket</Link>
          </li>
          <Nav />
          <li className="nav-right">
            <ErrorBoundary inline>
              <ConnectWallet />
            </ErrorBoundary>
          </li>
        </ul>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs showHero={false} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post" element={<PostJob />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/job/:jobId" element={<JobDetail />} />
          <Route path="/agent/:address" element={<AgentProfile />} />
        </Routes>
      </main>
      <ToastContainer />
    </ToastProvider>
  );
}
