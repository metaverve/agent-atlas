import { agents, datasetMeta } from "../../lib/data";
export const dynamic = "force-static";
export function GET() {
  const t = `# Agent Atlas

> Searchable catalog of ${datasetMeta.count} AI agents and agent frameworks with live GitHub stars, a stack graph (framework, model, memory, tooling, eval, deployment), a JSON API and an MCP server. Data derived from e2b-dev/awesome-ai-agents (CC BY-NC-SA 4.0).

## API
- [All agents (filterable)](/api/agents?q=coding&oss=true&sort=stars&limit=20): JSON. Params: q, category, useCase, oss, language, minStars, maxStars, tool, sort, limit, offset
- [One agent](/api/agents/{id})
- [Facets](/api/categories)
- [Stack graph](/api/graph)
- [OpenAPI spec](/api/openapi.json)
- [MCP server](/api/mcp): Streamable HTTP JSON-RPC. Tools: search_agents, get_agent, get_stack
- [Docs](/docs)

## Agents
${agents.map(a => `- [${a.name}](${a.url}): ${a.description} (${a.openSource ? "open source" : "closed"}; id ${a.id})`).join("\n")}
`;
  return new Response(t, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
