import { withStats, filterAgents, getStack, type Query } from "./data";

/** Shared tool schema: used by the MCP endpoint, the docs page and the xAI function-calling example. */
export const TOOLS = [
  { name: "search_agents", description: "Search the AI agent ecosystem catalog (214 agents from e2b-dev/awesome-ai-agents) with live GitHub stars.",
    inputSchema: { type: "object", properties: {
      q: { type: "string", description: "Free-text query, e.g. 'browser automation'" },
      category: { type: "array", items: { type: "string" }, description: "e.g. 'Multi-agent', 'Build your own', 'General purpose'" },
      useCase: { type: "array", items: { type: "string" }, description: "e.g. 'Coding', 'Research', 'Sales'" },
      oss: { type: "boolean", description: "true = open source only, false = closed only" },
      language: { type: "string" }, minStars: { type: "number" },
      sort: { type: "string", enum: ["stars", "name", "recent", "forks"] }, limit: { type: "number", default: 10 } } } },
  { name: "get_agent", description: "Get one agent by id (slug), including links and live GitHub stats.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "get_stack", description: "Get the stack neighborhood of a tool (e.g. 'langchain', 'chroma', 'grok') or agent id: which frameworks, models, memory, tooling, eval and deployment pieces connect to it. Edges are 'curated' or 'inferred'.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
] as const;

export async function runTool(name: string, args: Record<string, unknown>) {
  const { agents, meta } = await withStats();
  if (name === "search_agents") {
    const q: Query = { q: args.q as string, category: args.category as string[], useCase: args.useCase as string[],
      oss: args.oss === undefined ? undefined : args.oss ? "true" : "false", language: args.language ? [args.language as string] : undefined,
      minStars: args.minStars as number, sort: args.sort as Query["sort"], limit: Math.min(Number(args.limit ?? 10), 50) };
    const r = filterAgents(agents, q);
    return { total: r.total, statsMode: meta.mode, items: r.items.map(a => ({ id: a.id, name: a.name, url: a.url, description: a.description, category: a.category, useCases: a.useCases, openSource: a.openSource, stars: a.stats?.stars ?? null, language: a.stats?.language ?? null })) };
  }
  if (name === "get_agent") return agents.find(a => a.id === args.id) ?? { error: `no agent '${args.id}'` };
  if (name === "get_stack") return getStack(String(args.id)) ?? { error: `no tool or agent '${args.id}'` };
  throw new Error(`unknown tool ${name}`);
}
