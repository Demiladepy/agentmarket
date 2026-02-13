import { Link } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { agentRegistryAddress } from "../config";
import { agentRegistryAbi } from "../abis";

export function Reputation() {
  const { address, isConnected } = useAccount();
  const { data: agentData } = useReadContract({
    address: agentRegistryAddress ?? "0x0000000000000000000000000000000000000000",
    abi: agentRegistryAbi,
    functionName: "getAgent",
    args: address ? [address] : undefined,
    query: { enabled: !!agentRegistryAddress && !!address },
  });

  if (!isConnected || !address) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Connect your wallet to see your reputation.</p>
        </div>
      </div>
    );
  }

  if (!agentRegistryAddress) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Set VITE_AGENT_REGISTRY_ADDRESS in .env.</p>
        </div>
      </div>
    );
  }

  const tuple = agentData as [string, string, bigint, bigint, bigint, bigint, boolean] | undefined;
  const [wallet, metadataUri, avgRating, totalRatings, totalJobs, totalEarned, active] = tuple ?? [
    "0x0000000000000000000000000000000000000000",
    "",
    0n,
    0n,
    0n,
    0n,
    false,
  ];

  const notRegistered =
    !tuple || wallet === "0x0000000000000000000000000000000000000000";

  if (notRegistered) {
    return (
      <div className="container container--narrow">
        <div className="page-header">
          <h1 className="page-title">My reputation</h1>
        </div>
        <div className="card">
          <p style={{ margin: 0 }}>You are not registered as an agent. <Link to="/register">Register</Link> first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container container--narrow">
      <div className="page-header">
        <h1 className="page-title">My reputation</h1>
        <p className="page-desc">Your on-chain agent stats and earnings.</p>
      </div>
      <div className="card">
        <h3>Agent stats</h3>
        <div className="card-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
          <div className="card-metric"><strong>Wallet</strong><br /><span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", wordBreak: "break-all" }}>{address}</span></div>
          <div className="card-metric"><strong>Average rating</strong><br /><span>{avgRating != null ? Number(avgRating) : "—"} / 100</span></div>
          <div className="card-metric"><strong>Total ratings</strong><br /><span>{totalRatings != null ? Number(totalRatings) : "—"}</span></div>
          <div className="card-metric"><strong>Jobs completed</strong><br /><span>{totalJobs != null ? Number(totalJobs) : "—"}</span></div>
          <div className="card-metric"><strong>Total earned</strong><br /><span>{totalEarned != null ? formatEther(totalEarned) : "0"} MON</span></div>
          <div className="card-metric"><strong>Active</strong><br /><span>{active ? "Yes" : "No"}</span></div>
        </div>
        <p style={{ marginTop: "var(--space-4)", marginBottom: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          <strong>Metadata:</strong> {metadataUri || "—"}
        </p>
      </div>
    </div>
  );
}
