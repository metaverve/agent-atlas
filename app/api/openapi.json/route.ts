import { json } from "../../../lib/http";
import { TOOLS } from "../../../lib/tools";
const p = (name: string, d: string, schema: object = { type: "string" }) => ({ name, in: "query", required: false, description: d, schema });
export const dynamic = "force-static";
export function GET() {
  return json({ openapi: "3.1.0", info: { title: "Agent Atlas API", version: "1.0.0", description: "AI agent ecosystem catalog with live GitHub stats. Data: CC BY-NC-SA 4.0, derived from e2b-dev/awesome-ai-agents.", license: { name: "MIT (code) / CC BY-NC-SA 4.0 (data)" } },
    paths: {
      "/api/agents": { get: { summary: "List/filter agents", parameters: [p("q", "free text"), p("category", "comma list"), p("useCase", "comma list"), p("oss", "true|false"), p("language", "comma list"), p("minStars", "", { type: "integer" }), p("maxStars", "", { type: "integer" }), p("tool", "stack tool id, e.g. langchain"), p("sort", "", { type: "string", enum: ["stars", "name", "recent", "forks"] }), p("limit", "", { type: "integer" }), p("offset", "", { type: "integer" })], responses: { "200": { description: "{ total, count, stats, dataset, items[] }" } } } },
      "/api/agents/{id}": { get: { summary: "One agent", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Agent" }, "404": { description: "Not found" } } } },
      "/api/categories": { get: { summary: "Category and use-case facets with counts", responses: { "200": { description: "facets" } } } },
      "/api/graph": { get: { summary: "Stack graph (nodes, edges with kind curated|inferred)", parameters: [p("agents", "include agent nodes (default true)")], responses: { "200": { description: "graph" } } } },
      "/api/mcp": { post: { summary: "MCP server (Streamable HTTP, JSON-RPC 2.0)", description: `Tools: ${TOOLS.map(t => t.name).join(", ")}`, responses: { "200": { description: "JSON-RPC response" } } } },
    } });
}
