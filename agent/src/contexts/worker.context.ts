import { ethers } from "ethers";
import type { MonadProvider } from "../types.js";

export type WorkerConfig = {
  agentAddress: string;
  skills: string[];
  minPayment: number;
};

type MarketplaceLike = { getAvailableJobs: (p: { skillFilter?: string; minPayment?: number }) => Promise<{ jobs: Array<{ jobId: string; skillsRequired: string; description: string; payment: string }> }> };
type ReputationLike = { getReputation: (address: string) => Promise<unknown> };

export function createWorkerContext(
  monad: MonadProvider,
  marketplace: MarketplaceLike,
  _reputation: ReputationLike
) {
  const memory = {
    activeJobs: [] as Array<{ jobId: string; description: string; payment: number; acceptedAt: number }>,
    completedJobs: [] as Array<{ jobId: string; payment: number; deliverableUri?: string }>,
    earnings: 0,
    status: "idle" as "idle" | "searching" | "working",
  };

  return {
    type: "worker" as const,
    memory,
    config: {} as WorkerConfig,

    setConfig(config: WorkerConfig) {
      this.config = config;
    },

    async findJobs(params: { autoAccept?: boolean }) {
      memory.status = "searching";
      const { jobs } = await marketplace.getAvailableJobs({
        skillFilter: this.config.skills[0],
        minPayment: this.config.minPayment,
      });
      const matching = jobs.filter((j) =>
        monad.isV1
          ? true
          : this.config.skills.some((s) => String(j.skillsRequired).toLowerCase().includes(s.toLowerCase()))
      );
      if (matching.length === 0) {
        memory.status = "idle";
        return { message: "No matching jobs found", searched: jobs.length };
      }
      if (params.autoAccept && matching.length > 0) {
        const best = matching.sort((a, b) => Number(b.payment) - Number(a.payment))[0];
        return await this.acceptJob({ jobId: best.jobId });
      }
      memory.status = "idle";
      return { jobs: matching, count: matching.length, bestMatch: matching[0] };
    },

    async acceptJob(params: { jobId: string }) {
      const tx = await monad.jobMarket.acceptJob(params.jobId);
      await tx.wait();
      const raw = await monad.jobMarket.getJob(params.jobId);
      const description = monad.isV1 ? String((raw as [unknown, unknown, string, unknown, unknown])[2]) : (raw as { description: string }).description;
      const payment = monad.isV1 ? (raw as [unknown, unknown, unknown, bigint, unknown])[3] : (raw as { payment: bigint }).payment;
      memory.activeJobs.push({
        jobId: params.jobId,
        description,
        payment: Number(ethers.formatEther(payment)),
        acceptedAt: Date.now(),
      });
      memory.status = "working";
      return { jobId: params.jobId, status: "accepted", payment: Number(ethers.formatEther(payment)), txHash: (tx as { hash: string }).hash };
    },

    async completeJob(params: { jobId: string; deliverableUri: string }) {
      let txHash = "0x";
      if (monad.isV1) {
        const tx = await monad.jobMarket.completeJob(params.jobId);
        await tx.wait();
        txHash = (tx as { hash: string }).hash;
      } else {
        const tx = await monad.jobMarket.completeJob(params.jobId, params.deliverableUri);
        await tx.wait();
        txHash = (tx as { hash: string }).hash;
      }
      const idx = memory.activeJobs.findIndex((j) => j.jobId === params.jobId);
      const completed = memory.activeJobs[idx];
      if (completed) {
        memory.activeJobs.splice(idx, 1);
        memory.completedJobs.push({
          jobId: completed.jobId,
          payment: completed.payment,
          deliverableUri: params.deliverableUri || undefined,
        });
        memory.earnings += completed.payment;
      }
      memory.status = memory.activeJobs.length > 0 ? "working" : "idle";
      return { jobId: params.jobId, status: "completed", deliverableUri: params.deliverableUri || "", earnings: memory.earnings, txHash };
    },
  };
}
