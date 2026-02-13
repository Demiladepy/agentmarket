import type { MonadProvider } from "../types.js";

interface MarketplaceLike {
  postJob(p: { description: string; skillsRequired: string; payment: number }): Promise<{ jobId: string; txHash: string }>;
}

export function createClientContext(monad: MonadProvider, marketplace: MarketplaceLike) {
  const memory = {
    postedJobs: [] as Array<{ jobId: string; description: string; payment: number; postedAt: number }>,
    totalSpent: 0,
  };

  return {
    type: "client" as const,
    memory,
    config: { clientAddress: "", budget: 0 },

    setConfig(config: { clientAddress: string; budget: number }) {
      this.config = config;
    },

    async postJobWithBudget(params: { description: string; skillsRequired: string; payment: number }) {
      const remaining = this.config.budget - memory.totalSpent;
      if (params.payment > remaining) {
        return { error: "Insufficient budget", requested: params.payment, available: remaining };
      }
      const result = await marketplace.postJob(params);
      memory.postedJobs.push({
        jobId: result.jobId,
        description: params.description,
        payment: params.payment,
        postedAt: Date.now(),
      });
      memory.totalSpent += params.payment;
      return result;
    },

    async submitFeedback(params: { jobId: string; rating: number; commentUri?: string; proofOfPayment?: string }) {
      const job = await monad.jobMarket.getJob(params.jobId);
      if (monad.isV1) {
        const rating = Math.min(100, Math.max(0, Math.round(params.rating)));
        const tx = await monad.jobMarket.submitFeedback(params.jobId, rating);
        await tx.wait();
        const agent = (job as [unknown, string, unknown, unknown, unknown])[1];
        return { jobId: params.jobId, rating, agent, txHash: (tx as { hash: string }).hash };
      }
      const proofHex = (params.proofOfPayment ?? "").startsWith("0x") ? params.proofOfPayment! : "0x" + (params.proofOfPayment ?? "");
      const proofBytes32 = proofHex.length === 66 ? (proofHex as `0x${string}`) : ("0x" + "00".repeat(32)) as `0x${string}`;
      const rating = Math.min(5, Math.max(1, Math.round(params.rating)));
      const tx = await monad.jobMarket.submitFeedback(params.jobId, rating, params.commentUri ?? "", proofBytes32);
      await tx.wait();
      return { jobId: params.jobId, rating, agent: (job as { agent: string }).agent, txHash: (tx as { hash: string }).hash };
    },
  };
}
