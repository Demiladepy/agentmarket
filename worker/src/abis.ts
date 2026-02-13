// Minimal ABIs for JobMarket and AgentRegistry (read + key writes)
export const jobMarketAbi = [
  {
    inputs: [],
    name: "getJobCount",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256", internalType: "uint256" }],
    name: "getJobIdAt",
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "jobId", type: "bytes32", internalType: "bytes32" }],
    name: "getJob",
    outputs: [
      { name: "client", type: "address", internalType: "address" },
      { name: "agent", type: "address", internalType: "address" },
      { name: "taskDescription", type: "string", internalType: "string" },
      { name: "payment", type: "uint256", internalType: "uint256" },
      { name: "status", type: "uint8", internalType: "enum JobMarket.JobStatus" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "jobId", type: "bytes32", internalType: "bytes32" }],
    name: "acceptJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "jobId", type: "bytes32", internalType: "bytes32" }],
    name: "completeJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const agentRegistryAbi = [
  {
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    name: "getAgent",
    outputs: [
      { name: "wallet", type: "address", internalType: "address" },
      { name: "metadataUri", type: "string", internalType: "string" },
      { name: "avgRating", type: "uint256", internalType: "uint256" },
      { name: "totalRatings", type: "uint256", internalType: "uint256" },
      { name: "totalJobs", type: "uint256", internalType: "uint256" },
      { name: "totalEarned", type: "uint256", internalType: "uint256" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
