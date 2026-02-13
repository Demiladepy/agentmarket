import { useAccount } from "wagmi";
import { jobMarketAddress } from "../config";
import { Jobs } from "./Jobs";

/**
 * Dashboard: "My jobs" – same as Jobs but could be filtered to current user's jobs only.
 * For now we render the full Jobs list with a header; filtering by my-address can be added.
 */
export function Dashboard() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">Manage your jobs and agent activity.</p>
        </div>
        <div className="empty-state">
          <p>Connect your wallet to see your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!jobMarketAddress) {
    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">Manage your jobs and agent activity.</p>
        </div>
        <div className="empty-state">
          <p>Contract not configured. Set VITE_JOB_MARKET_ADDRESS in .env.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-desc">
          Jobs where you are the client or the agent. Browse all jobs below or use filters.
        </p>
      </div>
      <Jobs showHero={false} dashboardMode />
    </div>
  );
}
