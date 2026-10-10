import { TOOLS } from "../../lib/tools";
export const metadata = { title: "Agent Atlas — API & MCP docs" };
const ex = (s: string) => <pre>{s}</pre>;
export default function Docs() {
  return <div className="wrap" style={{ maxWidth: 900 }}>
    <div className="logo"><a href="/">◈ <span>Agent Atlas</span></a> <span className="note">API & MCP docs</span></div>
    <h2>REST JSON API</h2><p>All endpoints are public, CORS-enabled, and cached at the edge for 6 hours. Full spec: <a href="/api/openapi.json">/api/openapi.json</a>.</p>
    <table><tbody>
      <tr><td><a href="/api/agents?useCase=coding&oss=true&limit=5">GET /api/agents</a></td><td>q, category, useCase, oss, language, minStars, maxStars, tool, sort (stars|forks|recent|name), limit, offset</td></tr>
      <tr><td><a href="/api/agents/autogpt">GET /api/agents/[id]</a></td><td>One agent with live stats</td></tr>
      <tr><td><a href="/api/categories">GET /api/categories</a></td><td>Facets with counts</td></tr>
      <tr><td><a href="/api/graph">GET /api/graph</a></td><td>Stack graph. Edges have kind <code>curated</code> or <code>inferred</code> (keyword match, unverified). <code>?agents=false</code> for tools only.</td></tr>
    </tbody></table>
    {ex(`curl 'https://<host>/api/agents?q=browser&oss=true&minStars=1000&sort=stars&limit=5'`)}
    <h2>MCP server</h2><p>Streamable HTTP, stateless JSON-RPC at <code>POST /api/mcp</code>. Tools: {TOOLS.map(t => <code key={t.name}> {t.name}</code>)}.</p>
    {ex(`claude mcp add --transport http agent-atlas https://<host>/api/mcp

curl -s https://<host>/api/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_stack","arguments":{"id":"langchain"}}}'`)}
    <h2>Tool schemas (xAI / OpenAI function calling)</h2>
    {ex(JSON.stringify(TOOLS.map(t => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.inputSchema } })), null, 2))}
    <h2 id="ask">Ask Grok</h2><p>The <code>POST /api/ask</code> stack recommender runs Grok with the tools above. It is <b>only enabled when <code>XAI_API_KEY</code> is set</b> on the deployment; otherwise it returns 503 and the UI says it is disabled. It never fakes answers.</p>
    <h2>For LLMs</h2><p><a href="/llms.txt">/llms.txt</a> lists every agent and endpoint.</p>
  </div>;
}
