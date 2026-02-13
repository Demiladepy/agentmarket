import type { Contract } from "ethers";

export interface MonadProvider {
  wallet: { address: string };
  provider: { getBalance: (address: string) => Promise<bigint> };
  agentRegistry: Contract;
  jobMarket: Contract;
  x402Payment: Contract;
  isV1: boolean;
  getContract(name: string): Promise<Contract>;
  registerAgent(metadataUri: string): Promise<unknown>;
  getBalance(address: string): Promise<string>;
}
