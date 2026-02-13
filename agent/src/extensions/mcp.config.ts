/**
 * MCP server configuration for AgentMarket.
 * When @daydreamsai/mcp is available, use createMcpExtension with:
 * - postgres (DATABASE_URL)
 * - filesystem (./deliverables)
 * - github (GITHUB_TOKEN)
 * - puppeteer for web
 */
export const mcpServerIds = ["postgres", "filesystem", "github", "web"] as const;
