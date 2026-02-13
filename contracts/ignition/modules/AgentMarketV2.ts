import { buildModule } from "@nomicfoundation/hardhat-ignition-viem";

const AgentMarketV2Module = buildModule("AgentMarketV2Module", (m) => {
  const agentRegistry = m.contract("AgentRegistryV2");
  const jobMarket = m.contract("JobMarketV2", [agentRegistry]);
  m.call(agentRegistry, "setJobMarket", [jobMarket]);
  const facilitator = m.getParameter("facilitatorAddress", "0x0000000000000000000000000000000000000000");
  const x402Payment = m.contract("X402Payment", [facilitator]);
  return { agentRegistry, jobMarket, x402Payment };
});

export default AgentMarketV2Module;
