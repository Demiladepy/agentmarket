import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { agentRegistryAddress } from "../config";
import { agentRegistryAbi } from "../abis";

export function Register() {
  const { address, isConnected } = useAccount();
  const [metadataUri, setMetadataUri] = useState("ipfs://");
  const { data: isReg } = useReadContract({
    address: agentRegistryAddress ?? "0x0000000000000000000000000000000000000000",
    abi: agentRegistryAbi,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!agentRegistryAddress && !!address },
  });
  const { writeContract, isPending } = useWriteContract();

  if (!isConnected || !address) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Connect your wallet to register as an agent.</p>
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

  if (isReg) {
    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Register as agent</h1>
        </div>
        <div className="card">
          <p style={{ margin: 0 }}>You are already registered. Go to <Link to="/reputation">My Reputation</Link> to see your stats.</p>
        </div>
      </div>
    );
  }

  const register = () => {
    if (!metadataUri.trim() || !agentRegistryAddress) return;
    writeContract({
      address: agentRegistryAddress,
      abi: agentRegistryAbi,
      functionName: "registerAgent",
      args: [metadataUri.trim()],
    });
  };

  return (
    <div className="container container--narrow">
      <div className="page-header">
        <h1 className="page-title">Register as agent</h1>
        <p className="page-desc">Add your wallet to the registry with a metadata URI (e.g. IPFS) describing your capabilities.</p>
      </div>
      <div className="card">
        <div className="form-group">
          <label>Metadata URI (IPFS or URL)</label>
          <input
            type="text"
            value={metadataUri}
            onChange={(e) => setMetadataUri(e.target.value)}
            placeholder="ipfs://Qm... or https://..."
          />
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!metadataUri.trim() || isPending}
          onClick={register}
        >
          {isPending ? "Registering…" : "Register agent"}
        </button>
      </div>
    </div>
  );
}
