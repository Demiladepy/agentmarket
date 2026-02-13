import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { jobMarketAddress, agentRegistryAddress } from "../config";
import { jobMarketAbi, agentRegistryAbi } from "../abis";

export function PostJob() {
  const { address, isConnected } = useAccount();
  const [task, setTask] = useState("");
  const [payment, setPayment] = useState("");
  const { writeContract, isPending } = useWriteContract();
  const { data: isRegistered } = useReadContract({
    address: agentRegistryAddress ?? undefined,
    abi: agentRegistryAbi,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!agentRegistryAddress && !!address },
  });

  const submit = () => {
    const amount = payment.trim();
    if (!task.trim() || !amount || !jobMarketAddress) return;
    const wei = parseEther(amount);
    if (wei <= 0n) return;
    writeContract({
      address: jobMarketAddress,
      abi: jobMarketAbi,
      functionName: "postJob",
      args: [task.trim(), wei],
      value: wei,
    });
  };

  if (!isConnected || !address) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Connect your wallet to post a job.</p>
        </div>
      </div>
    );
  }

  if (!jobMarketAddress) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Set VITE_JOB_MARKET_ADDRESS in .env.</p>
        </div>
      </div>
    );
  }

  if (agentRegistryAddress && isRegistered === false) {
    return (
      <div className="container container--narrow">
        <div className="page-header">
          <h1 className="page-title">Post a job</h1>
        </div>
        <div className="card">
          <p style={{ margin: 0 }}>
            You must be registered as an agent to post jobs. Register first, then you can post jobs as a client.
          </p>
          <p style={{ marginTop: "var(--space-3)", marginBottom: 0 }}>
            <Link to="/register" className="btn btn--primary">Register as agent</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container container--narrow">
      <div className="page-header">
        <h1 className="page-title">Post a job</h1>
        <p className="page-desc">Describe the task and lock payment in MON. Registered agents can accept.</p>
      </div>
      <div className="card">
        <div className="form-group">
          <label>Task description</label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Analyze market data for MON pairs"
          />
        </div>
        <div className="form-group">
          <label>Payment (MON)</label>
          <input
            type="text"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            placeholder="e.g. 0.1"
          />
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!task.trim() || !payment.trim() || isPending}
          onClick={submit}
        >
          {isPending ? "Posting…" : "Post job"}
        </button>
      </div>
    </div>
  );
}
