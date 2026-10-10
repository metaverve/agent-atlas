import { TOOLS, runTool } from "../../../lib/tools";
import { CORS } from "../../../lib/http";
// Minimal stateless MCP server over Streamable HTTP (JSON responses, no SSE needed for these tools).
type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: any };
async function handle(m: Rpc) {
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id: m.id, result });
  switch (m.method) {
    case "initialize": return ok({ protocolVersion: m.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "agent-atlas", version: "1.0.0" } });
    case "ping": return ok({});
    case "tools/list": return ok({ tools: TOOLS });
    case "tools/call": try {
      const r = await runTool(m.params?.name, m.params?.arguments ?? {});
      return ok({ content: [{ type: "text", text: JSON.stringify(r) }], structuredContent: r, isError: false });
    } catch (e) { return ok({ content: [{ type: "text", text: String(e) }], isError: true }); }
    default: return { jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `Method not found: ${m.method}` } };
  }
}
export async function POST(req: Request) {
  let body: Rpc | Rpc[];
  try { body = await req.json(); } catch { return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS }); }
  const msgs = Array.isArray(body) ? body : [body];
  const reqs = msgs.filter(m => m.id !== undefined && m.id !== null);
  if (!reqs.length) return new Response(null, { status: 202, headers: CORS });
  const out = await Promise.all(reqs.map(handle));
  return Response.json(Array.isArray(body) ? out : out[0], { headers: CORS });
}
export function GET() { return Response.json({ name: "agent-atlas MCP", transport: "streamable-http (POST JSON-RPC)", tools: TOOLS.map(t => t.name) }, { headers: CORS }); }
export const OPTIONS = () => new Response(null, { headers: CORS });
