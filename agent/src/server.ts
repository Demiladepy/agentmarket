/**
 * AgentMarket HTTP agent server (Daydreams/Lucid-compatible API).
 * Exposes: /.well-known/agent.json, /entrypoints, POST /entrypoints/:key/invoke
 * No @lucid-agents/* required; uses Hono + zod only.
 * See: https://docs.daydreams.systems/docs/getting-started/quickstart
 */
import "dotenv/config";
import { z } from "zod";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createMonadProvider } from "./providers/monad.provider.js";
import { createMarketplaceContext } from "./contexts/marketplace.context.js";
import { createReputationContext } from "./contexts/reputation.context.js";
import { createWorkerContext } from "./contexts/worker.context.js";
import { createClientContext } from "./contexts/client.context.js";

const rpcUrl = process.env.MONAD_RPC_URL || process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const privateKey = process.env.MONAD_PRIVATE_KEY!;
const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS!;
const jobMarketAddress = process.env.JOB_MARKET_ADDRESS!;
const x402PaymentAddress = process.env.X402_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";
const useV1 = process.env.USE_V1_CONTRACTS === "true";

if (!privateKey || !agentRegistryAddress || !jobMarketAddress) {
  console.error("Set MONAD_PRIVATE_KEY, AGENT_REGISTRY_ADDRESS, JOB_MARKET_ADDRESS in .env");
  process.exit(1);
}

const monad = createMonadProvider({
  rpcUrl,
  privateKey,
  agentRegistryAddress,
  jobMarketAddress,
  x402PaymentAddress,
  useV1,
});

const marketplace = createMarketplaceContext(monad);
const reputation = createReputationContext(monad);
const worker = createWorkerContext(monad, marketplace, reputation);
const client = createClientContext(monad, marketplace);

const agentAddress = process.env.WORKER_ADDRESS || monad.wallet.address;
const skills = (process.env.WORKER_SKILLS || "data-analysis,web-scraping").split(",").map((s) => s.trim());
const minPayment = Number(process.env.WORKER_MIN_PAYMENT || "0.01");
worker.setConfig({ agentAddress, skills, minPayment });

client.setConfig({
  clientAddress: process.env.CLIENT_ADDRESS || monad.wallet.address,
  budget: Number(process.env.CLIENT_BUDGET || "10"),
});

const AGENT_NAME = "AgentMarket";
const AGENT_VERSION = "1.0.0";
const AGENT_DESCRIPTION =
  "On-chain job marketplace agent: find jobs, accept, complete, post jobs, and check reputation on Monad";

type EntrypointDef = {
  key: string;
  description: string;
  input: z.ZodType;
  handler: (input: unknown) => Promise<unknown>;
};

const entrypointDefs: EntrypointDef[] = [
  {
    key: "findJobs",
    description: "List available jobs matching optional skill and min payment",
    input: z.object({
      skillFilter: z.string().optional(),
      minPayment: z.number().optional(),
      autoAccept: z.boolean().optional(),
    }),
    async handler(input) {
      const i = input as { skillFilter?: string; minPayment?: number; autoAccept?: boolean };
      worker.setConfig({ ...worker.config, minPayment: i.minPayment ?? minPayment });
      return await worker.findJobs({ autoAccept: i.autoAccept });
    },
  },
  {
    key: "acceptJob",
    description: "Accept a job by jobId",
    input: z.object({ jobId: z.string() }),
    async handler(input) {
      return await worker.acceptJob({ jobId: (input as { jobId: string }).jobId });
    },
  },
  {
    key: "completeJob",
    description: "Complete a job. V2 requires deliverableUri; V1 ignores it.",
    input: z.object({ jobId: z.string(), deliverableUri: z.string().optional() }),
    async handler(input) {
      const i = input as { jobId: string; deliverableUri?: string };
      return await worker.completeJob({ jobId: i.jobId, deliverableUri: i.deliverableUri ?? "" });
    },
  },
  {
    key: "postJob",
    description: "Post a new job (description, skills, payment in MON)",
    input: z.object({
      description: z.string(),
      skillsRequired: z.string(),
      payment: z.number(),
    }),
    async handler(input) {
      const i = input as { description: string; skillsRequired: string; payment: number };
      return await client.postJobWithBudget(i);
    },
  },
  {
    key: "getReputation",
    description: "Get reputation for an agent address",
    input: z.object({ address: z.string() }),
    async handler(input) {
      return await reputation.getReputation((input as { address: string }).address);
    },
  },
  {
    key: "submitFeedback",
    description: "Submit feedback for a completed job. V1: rating 0–100 (commentUri/proof optional). V2: rating 1–5, commentUri, proofOfPayment.",
    input: z.object({
      jobId: z.string(),
      rating: z.number(),
      commentUri: z.string().optional(),
      proofOfPayment: z.string().optional(),
    }),
    async handler(input) {
      const i = input as { jobId: string; rating: number; commentUri?: string; proofOfPayment?: string };
      return await client.submitFeedback(i);
    },
  },
];

const entrypointsByKey = new Map(entrypointDefs.map((e) => [e.key, e]));

const app = new Hono();

app.get("/.well-known/agent.json", (c) => {
  return c.json({
    name: AGENT_NAME,
    version: AGENT_VERSION,
    description: AGENT_DESCRIPTION,
    entrypoints: entrypointDefs.map((e) => ({ key: e.key, description: e.description })),
  });
});

app.get("/entrypoints", (c) => {
  return c.json(entrypointDefs.map((e) => ({ key: e.key, description: e.description })));
});

app.post("/entrypoints/:key/invoke", async (c) => {
  const key = c.req.param("key");
  const def = entrypointsByKey.get(key);
  if (!def) {
    return c.json({ status: "error", error: `Unknown entrypoint: ${key}` }, 404);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: "error", error: "Invalid JSON body" }, 400);
  }
  const parsed = def.input.safeParse(
    typeof body === "object" && body !== null && "input" in body ? (body as { input: unknown }).input : body
  );
  if (!parsed.success) {
    return c.json({ status: "error", error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  try {
    const output = await def.handler(parsed.data);
    return c.json({ status: "completed", output });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ status: "error", error: message }, 500);
  }
});

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`AgentMarket agent: http://localhost:${info.port}`);
  console.log("  Manifest: http://localhost:%s/.well-known/agent.json", info.port);
  console.log("  Entrypoints: http://localhost:%s/entrypoints", info.port);
});
