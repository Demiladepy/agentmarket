import { ethers } from "ethers";
import type { MonadProvider } from "../types.js";

export type MarketplaceContextState = {
  availableJobs: Array<{
    jobId: string;
    client: string;
    description: string;
    skillsRequired: string;
    payment: string;
    status: number;
  }>;
  lastRefresh: number;
};

export function createMarketplaceContext(monad: MonadProvider) {
  return {
    type: "marketplace" as const,
    memory: { availableJobs: [] as MarketplaceContextState["availableJobs"], lastRefresh: 0 },

    async getAvailableJobs(params: { skillFilter?: string; minPayment?: number; maxPayment?: number }) {
      const count = await monad.jobMarket.getJobCount();
      const jobs: MarketplaceContextState["availableJobs"] = [];
      for (let i = 0; i < Number(count); i++) {
        const jobId = await monad.jobMarket.getJobIdAt(i);
        const raw = await monad.jobMarket.getJob(jobId);
        if (monad.isV1) {
          const [client, agent, taskDescription, payment, status] = raw as [string, string, string, bigint, number];
          if (status !== 0) continue;
          const paymentStr = ethers.formatEther(payment);
          const paymentNum = Number(paymentStr);
          if (params.minPayment != null && paymentNum < params.minPayment) continue;
          if (params.maxPayment != null && paymentNum > params.maxPayment) continue;
          const desc = String(taskDescription);
          if (params.skillFilter && !desc.toLowerCase().includes(params.skillFilter.toLowerCase())) continue;
          jobs.push({
            jobId,
            client,
            description: desc,
            skillsRequired: "",
            payment: paymentStr,
            status,
          });
        } else {
          const job = raw as { client: string; description: string; skillsRequired: string; payment: bigint; status: number };
          const status = Number(job.status);
          if (status !== 0) continue;
          const paymentStr = ethers.formatEther(job.payment);
          const paymentNum = Number(paymentStr);
          if (params.minPayment != null && paymentNum < params.minPayment) continue;
          if (params.maxPayment != null && paymentNum > params.maxPayment) continue;
          if (params.skillFilter && !String(job.skillsRequired).toLowerCase().includes(params.skillFilter.toLowerCase())) continue;
          jobs.push({
            jobId,
            client: job.client,
            description: job.description,
            skillsRequired: job.skillsRequired,
            payment: paymentStr,
            status,
          });
        }
      }
      this.memory.availableJobs = jobs;
      this.memory.lastRefresh = Date.now();
      return { jobs, count: jobs.length, refreshedAt: new Date(this.memory.lastRefresh).toISOString() };
    },

    async postJob(params: { description: string; skillsRequired: string; payment: number }) {
      const wei = ethers.parseEther(String(params.payment));
      if (monad.isV1) {
        const tx = await monad.jobMarket.postJob(params.description, wei, { value: wei });
        const receipt = await tx.wait();
        let jobId = "";
        if (receipt?.logs?.length) {
          const iface = (monad.jobMarket as { interface: { getEvent: (n: string) => { topicHash: string } } }).interface;
          const ev = iface.getEvent("JobPosted");
          if (ev) {
            const log = receipt.logs.find((l: { topics: string[] }) => l.topics[0] === ev.topicHash);
            if (log) jobId = log.topics[1];
          }
        }
        return { jobId: jobId || "0x0", txHash: (tx as { hash: string }).hash, status: "posted" };
      }
      const tx = await monad.jobMarket.postJob(params.description, params.skillsRequired, wei, { value: wei });
      const receipt = await tx.wait();
      let jobId = "";
      if (receipt?.logs?.length) {
        const iface = (monad.jobMarket as { interface: { getEvent: (n: string) => { topicHash: string } } }).interface;
        const ev = iface.getEvent("JobPosted");
        if (ev) {
          const log = receipt.logs.find((l: { topics: string[] }) => l.topics[0] === ev.topicHash);
          if (log) jobId = log.topics[1];
        }
      }
      return { jobId: jobId || "0x0", txHash: (tx as { hash: string }).hash, status: "posted" };
    },
  };
}
