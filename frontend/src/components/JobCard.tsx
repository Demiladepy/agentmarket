import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { jobMarketAddress } from "../config";
import { jobMarketAbi } from "../abis";

const STATUS = ["Posted", "Accepted", "Completed", "Disputed", "Cancelled"];

export type JobCardData = {
  jobId: `0x${string}`;
  client: string;
  agent: string;
  taskDescription: string;
  payment: bigint;
  status: number;
};

type JobCardProps = {
  job: JobCardData;
  index: number;
  onSuccess?: () => void;
  compact?: boolean;
};

function shortenAddress(addr: string) {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function JobCard({ job, index: _index, onSuccess, compact }: JobCardProps) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [rating, setRating] = useState("");
  const statusLabel = STATUS[job.status] ?? "Unknown";

  const accept = () => {
    if (!jobMarketAddress) return;
    writeContract({
      address: jobMarketAddress,
      abi: jobMarketAbi,
      functionName: "acceptJob",
      args: [job.jobId],
    });
    onSuccess?.();
  };

  const complete = () => {
    if (!jobMarketAddress) return;
    writeContract({
      address: jobMarketAddress,
      abi: jobMarketAbi,
      functionName: "completeJob",
      args: [job.jobId],
    });
    onSuccess?.();
  };

  const submitFeedback = () => {
    if (!jobMarketAddress) return;
    const r = Math.min(100, Math.max(0, parseInt(rating, 10) || 0));
    writeContract({
      address: jobMarketAddress,
      abi: jobMarketAbi,
      functionName: "submitFeedback",
      args: [job.jobId, r as unknown as number],
    });
    setRating("");
    onSuccess?.();
  };

  const isClient = address && job.client.toLowerCase() === address.toLowerCase();
  const canAccept = address && job.status === 0;
  const canComplete = address && job.status === 1 && isClient;
  const canFeedback = address && job.status === 2 && isClient;

  const description = job.taskDescription || "(No description)";
  const truncatedDesc = compact && description.length > 80 ? description.slice(0, 80) + "…" : description;

  return (
    <article className={`card job-card card--interactive`}>
      <div className="job-card__header">
        <h3 className="job-card__title">
          <Link to={`/job/${job.jobId}`} style={{ color: "inherit", textDecoration: "none" }}>
            {truncatedDesc}
          </Link>
        </h3>
        <span className={`badge ${statusLabel.toLowerCase()}`}>{statusLabel}</span>
        <span className="job-card__payment">{formatEther(job.payment)} MON</span>
      </div>
      <p className="job-card__meta">
        Client: {shortenAddress(job.client)}
        {" · "}
        Agent: {shortenAddress(job.agent)}
      </p>
      {!compact && (
        <div className="job-card__actions">
          {canAccept && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!jobMarketAddress || isPending}
              onClick={accept}
            >
              {isPending ? "Accepting…" : "Accept job"}
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              className="btn btn--success btn--primary"
              disabled={!jobMarketAddress || isPending}
              onClick={complete}
            >
              {isPending ? "Completing…" : "Mark complete"}
            </button>
          )}
          {canFeedback && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <label htmlFor={`rating-${job.jobId}`} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                Rate (0–100):
              </label>
              <input
                id={`rating-${job.jobId}`}
                type="number"
                min={0}
                max={100}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={{ width: "4rem", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--bg-raised)", color: "var(--text-primary)" }}
              />
              <button
                type="button"
                className="btn btn--secondary"
                disabled={!jobMarketAddress || isPending}
                onClick={submitFeedback}
              >
                {isPending ? "Submitting…" : "Submit feedback"}
              </button>
            </div>
          )}
          <Link to={`/job/${job.jobId}`} className="btn btn--ghost">
            View details
          </Link>
        </div>
      )}
    </article>
  );
}
