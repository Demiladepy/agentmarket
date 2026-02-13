import { describe, it } from "node:test";
import assert from "node:assert/strict";
import hre from "hardhat";

const PAYMENT = 1_000_000_000_000_000n; // 0.001 MON

describe("AgentMarket", function () {
  it("should register agents and post a job", async function () {
    const viem = (hre as any).viem;
    if (!viem) {
      this.skip();
      return;
    }
    const [clientWallet, agentWallet] = await viem.getWalletClients();
    if (!clientWallet || !agentWallet) {
      this.skip();
      return;
    }

    const agentRegistry = await viem.deployContract("AgentRegistry");
    const escrow = await viem.deployContract("Escrow");
    const jobMarket = await viem.deployContract("JobMarket", [
      agentRegistry.address,
      escrow.address,
    ]);
    await agentRegistry.write.setJobMarket([jobMarket.address]);
    await escrow.write.setJobMarket([jobMarket.address]);

    await agentRegistry.write.registerAgent(["ipfs://client-metadata"], {
      account: clientWallet.account,
    });
    await agentRegistry.write.registerAgent(["ipfs://agent-metadata"], {
      account: agentWallet.account,
    });

    const [reg] = await agentRegistry.read.getAgent([clientWallet.account.address]);
    assert.equal(reg[0], clientWallet.account.address);
    assert.equal(reg[1], "ipfs://client-metadata");

    await jobMarket.write.postJob(["Analyze market data", PAYMENT], {
      account: clientWallet.account,
      value: PAYMENT,
    });

    const jobCount = await jobMarket.read.getJobCount();
    assert.equal(jobCount, 1n);
    const jobId = await jobMarket.read.getJobIdAt([0n]);
    const job = await jobMarket.read.getJob([jobId]);
    assert.equal(job[0], clientWallet.account.address);
    assert.equal(job[2], "Analyze market data");
    assert.equal(job[3], PAYMENT);
    assert.equal(job[4], 0); // Posted
  });

  it("should accept job, complete, and submit feedback", async function () {
    const viem = (hre as any).viem;
    if (!viem) {
      this.skip();
      return;
    }
    const [clientWallet, agentWallet] = await viem.getWalletClients();
    if (!clientWallet || !agentWallet) {
      this.skip();
      return;
    }

    const agentRegistry = await viem.deployContract("AgentRegistry");
    const escrow = await viem.deployContract("Escrow");
    const jobMarket = await viem.deployContract("JobMarket", [
      agentRegistry.address,
      escrow.address,
    ]);
    await agentRegistry.write.setJobMarket([jobMarket.address]);
    await escrow.write.setJobMarket([jobMarket.address]);

    await agentRegistry.write.registerAgent(["ipfs://client"], { account: clientWallet.account });
    await agentRegistry.write.registerAgent(["ipfs://agent"], { account: agentWallet.account });
    await jobMarket.write.postJob(["Web search task", PAYMENT], {
      account: clientWallet.account,
      value: PAYMENT,
    });
    const jobId = await jobMarket.read.getJobIdAt([0n]);

    await jobMarket.write.acceptJob([jobId], { account: agentWallet.account });
    let job = await jobMarket.read.getJob([jobId]);
    assert.equal(job[4], 1); // Accepted

    await jobMarket.write.completeJob([jobId], { account: clientWallet.account });
    job = await jobMarket.read.getJob([jobId]);
    assert.equal(job[4], 2); // Completed

    await jobMarket.write.submitFeedback([jobId, 85], { account: clientWallet.account });
    const [agentData] = await agentRegistry.read.getAgent([agentWallet.account.address]);
    assert.equal(agentData[2], 85n); // avgRating
    assert.equal(agentData[4], 1n); // totalJobs
    assert.equal(agentData[5], PAYMENT); // totalEarned
  });
});
