import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { jobMarketAddress } from "../config";
import { jobMarketAbi } from "../abis";

const STATUS = ["Posted", "Accepted", "Completed", "Disputed", "Cancelled"];

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { address } = useAccount();
  const id = jobId?.startsWith("0x") ? (jobId as `0x${string}`) : undefined;

  const { data, isLoading, isError } = useReadContract({
    address: id && jobMarketAddress ? jobMarketAddress : undefined,
    abi: jobMarketAbi,
    functionName: "getJob",
    args: id ? [id] : undefined,
  });

  const [client, agent, taskDescription, payment, status] = (data as [string, string, string, bigint, number] | undefined) ?? [
    "",
    "",
    "",
    0n,
    0,
  ];
  const statusLabel = STATUS[status] ?? "Unknown";
  const isClient = address && client && client.toLowerCase() === address.toLowerCase();

  if (!jobId || !id) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Invalid job ID.</p>
          <Link to="/" className="btn btn--primary">Back to jobs</Link>
        </div>
      </div>
    );
  }

  if (isError || (data === undefined && !isLoading)) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Job not found or contract not configured.</p>
          <Link to="/" className="btn btn--primary">Back to jobs</Link>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ color: "var(--text-secondary)" }}>Loading job…</p>
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
          {taskDescription || "(No description)"}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", marginTop: "var(--space-2)" }}>
          <span className={`badge ${statusLabel.toLowerCase()}`}>{statusLabel}</span>
          <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--mon)" }}>
            {formatEther(payment)} MON
          </span>
        </div>
      </div>

      <div className="card">
        <h3>Details</h3>
        <dl style={{ margin: 0, display: "grid", gap: "var(--space-2)" }}>
          <div>
            <dt style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>Client</dt>
            <dd style={{ margin: 0 }}>
              <Link to={`/agent/${client}`}>{client}</Link>
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>Agent</dt>
            <dd style={{ margin: 0 }}>
              {agent === "0x0000000000000000000000000000000000000000" ? "—" : <Link to={`/agent/${agent}`}>{agent}</Link>}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>Job ID</dt>
            <dd style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", wordBreak: "break-all" }}>{jobId}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h3>Actions</h3>
        {address && status === 0 && !isClient && <AcceptButton jobId={id} />}
        {address && status === 0 && isClient && <CancelButton jobId={id} />}
        {address && status === 1 && isClient && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <CompleteButton jobId={id} />
            <DisputeButton jobId={id} />
          </div>
        )}
        {address && status === 2 && isClient && <FeedbackForm jobId={id} />}
        {address && ((status === 1 && !isClient) || (status === 2 && !isClient) || status >= 3) && (
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No actions available for you on this job.</p>
        )}
      </div>
    </div>
  );
}

function AcceptButton({ jobId }: { jobId: `0x${string}` }) {
  const { writeContract, isPending } = useWriteContract();
  return (
    <button
      type="button"
      className="btn btn--primary"
      disabled={!jobMarketAddress || isPending}
      onClick={() => writeContract({ address: jobMarketAddress!, abi: jobMarketAbi, functionName: "acceptJob", args: [jobId] })}
    >
      {isPending ? "Accepting…" : "Accept job"}
    </button>
  );
}

function CompleteButton({ jobId }: { jobId: `0x${string}` }) {
  const { writeContract, isPending } = useWriteContract();
  return (
    <button
      type="button"
      className="btn btn--primary btn--success"
      disabled={!jobMarketAddress || isPending}
      onClick={() => writeContract({ address: jobMarketAddress!, abi: jobMarketAbi, functionName: "completeJob", args: [jobId] })}
    >
      {isPending ? "Completing…" : "Mark complete"}
    </button>
  );
}

function CancelButton({ jobId }: { jobId: `0x${string}` }) {
  const { writeContract, isPending } = useWriteContract();
  return (
    <button
      type="button"
      className="btn btn--secondary"
      disabled={!jobMarketAddress || isPending}
      onClick={() => writeContract({ address: jobMarketAddress!, abi: jobMarketAbi, functionName: "cancelJob", args: [jobId] })}
    >
      {isPending ? "Cancelling…" : "Cancel job (refund)"}
    </button>
  );
}

function DisputeButton({ jobId }: { jobId: `0x${string}` }) {
  const { writeContract, isPending } = useWriteContract();
  return (
    <button
      type="button"
      className="btn btn--secondary"
      disabled={!jobMarketAddress || isPending}
      onClick={() => writeContract({ address: jobMarketAddress!, abi: jobMarketAbi, functionName: "disputeJob", args: [jobId] })}
    >
      {isPending ? "Disputing…" : "Dispute (refund)"}
    </button>
  );
}

function FeedbackForm({ jobId }: { jobId: `0x${string}` }) {
  const [rating, setRating] = useState("");
  const { writeContract, isPending } = useWriteContract();
  const r = Math.min(100, Math.max(0, parseInt(rating, 10) || 0));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
      <label style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Rate agent (0–100):</label>
      <input
        type="number"
        min={0}
        max={100}
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        style={{ width: "5rem", padding: "var(--space-2) var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-raised)", color: "var(--text-primary)" }}
      />
      <button
        type="button"
        className="btn btn--secondary"
        disabled={!jobMarketAddress || isPending}
        onClick={() => writeContract({ address: jobMarketAddress!, abi: jobMarketAbi, functionName: "submitFeedback", args: [jobId, r as unknown as number] })}
      >
        {isPending ? "Submitting…" : "Submit feedback"}
      </button>
    </div>
  );
}
