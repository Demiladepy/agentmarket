/**
 * OpenClaw plugin: AgentMarket agent tools.
 * Registers tools that call the AgentMarket HTTP agent server (POST /entrypoints/:key/invoke).
 * Requires the agent server to be running (npm run serve in agent/).
 */

type RegisterToolOptions = { optional?: boolean };

function isPluginApi(api: unknown): api is {
  config: { plugins?: { entries?: Record<string, { config?: { agentServerUrl?: string } }> } };
  registerTool: (
    def: {
      name: string;
      description: string;
      parameters: object;
      execute: (id: unknown, params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;
    },
    options?: RegisterToolOptions
  ) => void;
} {
  return (
    typeof api === "object" &&
    api !== null &&
    "registerTool" in api &&
    typeof (api as { registerTool: unknown }).registerTool === "function"
  );
}

async function invokeEntrypoint(
  baseUrl: string,
  key: string,
  input: Record<string, unknown>
): Promise<{ status: string; output?: unknown; error?: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}/entrypoints/${key}/invoke`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const data = (await res.json()) as { status?: string; output?: unknown; error?: string };
  if (!res.ok) {
    return { status: "error", error: data.error || res.statusText || String(res.status) };
  }
  return {
    status: (data.status as string) || "completed",
    output: data.output,
    error: data.error,
  };
}

function getAgentServerUrl(api: { config: { plugins?: { entries?: Record<string, { config?: { agentServerUrl?: string } }> } } }): string {
  const url = api.config?.plugins?.entries?.agentmarket?.config?.agentServerUrl;
  if (!url || typeof url !== "string") {
    return "http://localhost:3000";
  }
  return url;
}

export default function (api: unknown) {
  if (!isPluginApi(api)) {
    return;
  }
  const baseUrl = getAgentServerUrl(api);

  const tools: Array<{
    name: string;
    description: string;
    parameters: object;
    key: string;
    mapInput?: (p: Record<string, unknown>) => Record<string, unknown>;
  }> = [
    {
      name: "agentmarket_find_jobs",
      description: "List available jobs on AgentMarket. Optionally filter by skill or min payment (MON). Set autoAccept to true to accept the best matching job.",
      parameters: {
        type: "object",
        properties: {
          skillFilter: { type: "string", description: "Filter jobs by keyword/skill" },
          minPayment: { type: "number", description: "Minimum payment in MON" },
          autoAccept: { type: "boolean", description: "If true, accept the best matching job" },
        },
        required: [],
      },
      key: "findJobs",
    },
    {
      name: "agentmarket_accept_job",
      description: "Accept a job on AgentMarket by job ID (hex bytes32).",
      parameters: {
        type: "object",
        properties: { jobId: { type: "string", description: "Job ID (0x...)" } },
        required: ["jobId"],
      },
      key: "acceptJob",
    },
    {
      name: "agentmarket_complete_job",
      description: "Mark a job complete (client only). Optionally pass deliverableUri for V2 contracts.",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "string", description: "Job ID (0x...)" },
          deliverableUri: { type: "string", description: "Optional result URI (V2)" },
        },
        required: ["jobId"],
      },
      key: "completeJob",
    },
    {
      name: "agentmarket_post_job",
      description: "Post a new job on AgentMarket (description, skills string, payment in MON).",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          skillsRequired: { type: "string" },
          payment: { type: "number", description: "Payment in MON" },
        },
        required: ["description", "skillsRequired", "payment"],
      },
      key: "postJob",
    },
    {
      name: "agentmarket_get_reputation",
      description: "Get on-chain reputation for an agent address (rating, total jobs, badges).",
      parameters: {
        type: "object",
        properties: { address: { type: "string", description: "Agent wallet address (0x...)" } },
        required: ["address"],
      },
      key: "getReputation",
    },
    {
      name: "agentmarket_submit_feedback",
      description: "Submit feedback for a completed job (client only). V1: rating 0-100. V2: rating 1-5, commentUri, proofOfPayment.",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "string" },
          rating: { type: "number" },
          commentUri: { type: "string" },
          proofOfPayment: { type: "string" },
        },
        required: ["jobId", "rating"],
      },
      key: "submitFeedback",
    },
  ];

  for (const tool of tools) {
    api.registerTool(
      {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        async execute(_id, params) {
          const input = tool.mapInput ? tool.mapInput(params) : params;
          const result = await invokeEntrypoint(baseUrl, tool.key, input);
          const text =
            result.status === "completed"
              ? JSON.stringify(result.output, null, 2)
              : `Error: ${result.error || result.status}`;
          return { content: [{ type: "text", text }] };
        },
      },
      { optional: true }
    );
  }
}
