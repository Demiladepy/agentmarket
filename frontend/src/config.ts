const _registry = import.meta.env.VITE_AGENT_REGISTRY_ADDRESS;
const _jobMarket = import.meta.env.VITE_JOB_MARKET_ADDRESS;

/** Valid 0x + 40 hex chars (42 total). Treat "0x" or placeholder as unset. */
function asAddress(v: string | undefined): `0x${string}` | undefined {
  if (!v || typeof v !== "string") return undefined;
  const s = v.trim();
  if (s.length !== 42 || !s.startsWith("0x") || !/^0x[0-9a-fA-F]{40}$/.test(s)) return undefined;
  return s as `0x${string}`;
}

/** Set in .env; when unset or invalid, contract reads are skipped to avoid RPC errors. */
export const agentRegistryAddress = asAddress(_registry);
export const jobMarketAddress = asAddress(_jobMarket);
