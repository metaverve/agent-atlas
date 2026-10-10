import { TOOLS, runTool } from "../../../lib/tools";
// Optional "Ask Grok" stack recommender. Only active when XAI_API_KEY is set; never returns fabricated answers.
export async function GET() { return Response.json({ enabled: !!process.env.XAI_API_KEY }); }
export async function POST(req: Request) {
  const key = process.env.XAI_API_KEY;
  if (!key) return Response.json({ enabled: false, error: "Ask Grok is disabled: XAI_API_KEY is not configured on this deployment." }, { status: 503 });
  const { question } = await req.json().catch(() => ({}));
  if (!question || String(question).length > 500) return Response.json({ error: "question required (max 500 chars)" }, { status: 400 });
  const tools = TOOLS.map(t => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.inputSchema } }));
  const messages: any[] = [{ role: "system", content: "You recommend AI agent stacks using ONLY the agent-atlas tools. Cite agent names from tool results. Be concise." }, { role: "user", content: String(question) }];
  for (let i = 0; i < 4; i++) {
    const r = await fetch("https://api.x.ai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.XAI_MODEL || "grok-4-fast", messages, tools }) });
    if (!r.ok) return Response.json({ error: `xAI API error ${r.status}` }, { status: 502 });
    const msg = (await r.json()).choices[0].message; messages.push(msg);
    if (!msg.tool_calls?.length) return Response.json({ enabled: true, answer: msg.content });
    for (const c of msg.tool_calls) messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(await runTool(c.function.name, JSON.parse(c.function.arguments || "{}"))) });
  }
  return Response.json({ error: "too many tool rounds" }, { status: 500 });
}
