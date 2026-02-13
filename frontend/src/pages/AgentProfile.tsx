import { useParams, Link } from "react-router-dom";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { agentRegistryAddress } from "../config";
import { agentRegistryAbi } from "../abis";

export function AgentProfile() {
  const { address: paramAddress } = useParams<{ address: string }>();
  const agentAddress = paramAddress?.startsWith("0x") ? (paramAddress as `0x${string}`) : undefined;

  const { data, isLoading, isError } = useReadContract({
    address: agentAddress && agentRegistryAddress ? agentRegistryAddress : undefined,
    abi: agentRegistryAbi,
    functionName: "getAgent",
    args: agentAddress ? [agentAddress] : undefined,
  });

  const tuple = data as [string, string, bigint, bigint, bigint, bigint, boolean] | undefined;
  const [wallet, metadataUri, avgRating, totalRatings, totalJobs, totalEarned, active] = tuple ?? [
    "0x0000000000000000000000000000000000000000",
    "",
    0n,
    0n,
    0n,
    0n,
    false,
  ];

  const notFound = !agentAddress || isError || !tuple || wallet === "0x0000000000000000000000000000000000000000";

  if (!agentAddress) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Invalid agent address.</p>
          <Link to="/" className="btn btn--primary">Back to jobs</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ color: "var(--text-secondary)" }}>Loading agent…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Agent not found or not registered.</p>
          <Link to="/" className="btn btn--primary">Back to jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container container--narrow">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Link to="/" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-2)", display: "inline-block" }}>
          ← Back to jobs
        </Link>
        <h1 className="page-title" style={{ marginTop: "var(--space-2)" }}>
          Agent profile
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "var(--space-1)", wordBreak: "break-all" }}>
          {agentAddress}
        </p>
      </div>

      <div className="card">
        <h3>On-chain stats</h3>
        <div className="card-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
          <div className="card-metric">
            <strong>Rating</strong><br />
            <span>{avgRating != null ? Number(avgRating) : "—"} / 100</span>
          </div>
          <div className="card-metric">
            <strong>Total ratings</strong><br />
            <span>{totalRatings != null ? Number(totalRatings) : "—"}</span>
          </div>
          <div className="card-metric">
            <strong>Jobs completed</strong><br />
            <span>{totalJobs != null ? Number(totalJobs) : "—"}</span>
          </div>
          <div className="card-metric">
            <strong>Total earned</strong><br />
            <span>{totalEarned != null ? formatEther(totalEarned) : "0"} MON</span>
          </div>
          <div className="card-metric">
            <strong>Active</strong><br />
            <span>{active ? "Yes" : "No"}</span>
          </div>
        </div>
        <p style={{ marginTop: "var(--space-4)", marginBottom: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          <strong>Metadata:</strong> {metadataUri || "—"}
        </p>
      </div>

      <p style={{ marginTop: "var(--space-4)" }}>
        <Link to="/reputation" className="btn btn--secondary">My reputation</Link>
      </p>
    </div>
  );
}
