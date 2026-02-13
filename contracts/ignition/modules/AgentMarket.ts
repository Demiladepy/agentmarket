// Deploy AgentRegistry, Escrow, JobMarket; wire them together.
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentMarketModule = buildModule("AgentMarketModule", (m) => {
  const agentRegistry = m.contract("AgentRegistry");
  const escrow = m.contract("Escrow");

  const jobMarket = m.contract("JobMarket", [agentRegistry, escrow]);

  m.call(agentRegistry, "setJobMarket", [jobMarket]);
  m.call(escrow, "setJobMarket", [jobMarket]);

  return { agentRegistry, escrow, jobMarket };
});

export default AgentMarketModule;
