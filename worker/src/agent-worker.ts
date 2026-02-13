import { createPublicClient, createWalletClient, http, type Address, type Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { jobMarketAbi } from "./abis.js";

const JOB_STATUS = { Posted: 0, Accepted: 1, Completed: 2, Disputed: 3, Cancelled: 4 } as const;

export type JobInfo = {
  jobId: Hash;
  client: Address;
  agent: Address;
  taskDescription: string;
  payment: bigint;
  status: number;
};

export type AgentWorkerConfig = {
  rpcUrl: string;
  privateKey: `0x${string}`;
  jobMarketAddress: Address;
};

export function createClients(config: AgentWorkerConfig) {
  const transport = http(config.rpcUrl);
  const account = privateKeyToAccount(config.privateKey as `0x${string}`);
  const publicClient = createPublicClient({ transport });
  const walletClient = createWalletClient({ account, transport });
  return {
    publicClient,
    walletClient,
    account: account.address,
    jobMarketAddress: config.jobMarketAddress,
  };
}

/**
 * Scan JobMarket for open jobs (status = Posted). Optionally filter by keyword or max price.
 */
export async function scanJobs(
  publicClient: ReturnType<typeof createPublicClient>,
  jobMarketAddress: Address,
  options?: { skillFilter?: string; maxPayment?: bigint }
): Promise<JobInfo[]> {
  const count = await publicClient.readContract({
    address: jobMarketAddress,
    abi: jobMarketAbi,
    functionName: "getJobCount",
  });
  const results: JobInfo[] = [];
  for (let i = 0; i < Number(count); i++) {
    const jobId = await publicClient.readContract({
      address: jobMarketAddress,
      abi: jobMarketAbi,
      functionName: "getJobIdAt",
      args: [BigInt(i)],
    });
    const [client, agent, taskDescription, payment, status] = await publicClient.readContract({
      address: jobMarketAddress,
      abi: jobMarketAbi,
      functionName: "getJob",
      args: [jobId],
    });
    if (status !== JOB_STATUS.Posted) continue;
    if (options?.maxPayment !== undefined && payment > options.maxPayment) continue;
    if (
      options?.skillFilter &&
      !taskDescription.toLowerCase().includes(options.skillFilter.toLowerCase())
    )
      continue;
    results.push({
      jobId,
      client,
      agent,
      taskDescription,
      payment,
      status,
    });
  }
  return results;
}

/**
 * Accept a job. Transaction must be sent from a registered agent wallet.
 */
export async function acceptJob(
  walletClient: ReturnType<typeof createWalletClient>,
  jobMarketAddress: Address,
  jobId: Hash
): Promise<Hash> {
  if (!walletClient?.account) throw new Error("wallet client missing account");
  const hash = await walletClient.writeContract({
    address: jobMarketAddress,
    abi: jobMarketAbi,
    functionName: "acceptJob",
    args: [jobId],
    account: walletClient.account,
  });
  return hash;
}

/**
 * Mark a job complete. Transaction must be sent from the job client.
 */
export async function completeJob(
  walletClient: ReturnType<typeof createWalletClient>,
  jobMarketAddress: Address,
  jobId: Hash
): Promise<Hash> {
  if (!walletClient?.account) throw new Error("wallet client missing account");
  const hash = await walletClient.writeContract({
    address: jobMarketAddress,
    abi: jobMarketAbi,
    functionName: "completeJob",
    args: [jobId],
    account: walletClient.account,
  });
  return hash;
}

/**
 * Optional: run a loop that scans for jobs, evaluates, and accepts (demo: accept one then stop).
 * For real execution you would integrate with OpenClaw or a task runner to do the work before calling completeJob.
 */
export async function autoWorkLoop(
  config: AgentWorkerConfig,
  options?: { skillFilter?: string; maxPayment?: bigint; intervalMs?: number }
): Promise<void> {
  const { publicClient, walletClient, jobMarketAddress } = createClients(config);
  const intervalMs = options?.intervalMs ?? 30_000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const jobs = await scanJobs(publicClient, jobMarketAddress, {
      skillFilter: options?.skillFilter,
      maxPayment: options?.maxPayment,
    });
    for (const job of jobs) {
      try {
        const hash = await acceptJob(walletClient!, jobMarketAddress, job.jobId);
        console.log(`Accepted job ${job.jobId} tx ${hash}`);
        return; // one job per run for demo
      } catch (e) {
        console.warn(`Failed to accept ${job.jobId}:`, e);
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
