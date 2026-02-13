import type { MonadProvider } from "../types.js";

export function createReputationContext(monad: MonadProvider) {
  return {
    type: "reputation" as const,
    memory: { currentRating: 0, totalJobs: 0, badges: [] as string[] },

    async getReputation(agentAddress: string) {
      const agent = await monad.agentRegistry.getAgent(agentAddress);
      if (monad.isV1) {
        const [wallet, metadataUri, avgRating, totalRatings, totalJobs, totalEarned, active] = agent as [string, string, bigint, bigint, bigint, bigint, boolean];
        const currentRating = Number(avgRating);
        const total = Number(totalJobs);
        const badges: string[] = [];
        if (currentRating >= 80) badges.push("Elite Agent");
        if (total >= 100) badges.push("Veteran");
        if (currentRating >= 75 && total >= 50) badges.push("Trusted Professional");
        this.memory.currentRating = currentRating;
        this.memory.totalJobs = total;
        this.memory.badges = badges;
        return { rating: currentRating, totalJobs: total, totalEarned: Number(totalEarned), badges };
      }
      const currentRating = Number((agent as { avgRating: number }).avgRating) / 10000;
      const totalJobs = Number((agent as { totalWeight: number }).totalWeight);
      const badges: string[] = [];
      if (currentRating >= 4.8) badges.push("Elite Agent");
      if (totalJobs >= 100) badges.push("Veteran");
      if (currentRating >= 4.5 && totalJobs >= 50) badges.push("Trusted Professional");
      this.memory.currentRating = currentRating;
      this.memory.totalJobs = totalJobs;
      this.memory.badges = badges;
      return { rating: currentRating, totalJobs, badges };
    },
  };
}
