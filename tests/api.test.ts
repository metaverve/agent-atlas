import { describe, it, expect } from "vitest";
import { GET as list } from "../app/api/agents/route";
import { GET as one } from "../app/api/agents/[id]/route";
import { GET as graph } from "../app/api/graph/route";
import { GET as cats } from "../app/api/categories/route";
import { GET as spec } from "../app/api/openapi.json/route";
import { POST as mcp } from "../app/api/mcp/route";
import { POST as ask } from "../app/api/ask/route";
const req = (u: string) => new Request(`http://t${u}`);
const rpc = (b: unknown) => mcp(new Request("http://t/api/mcp", { method: "POST", body: JSON.stringify(b), headers: { "content-type": "application/json" } }));
describe("api", () => {
  it("lists & filters", async () => {
    const all = await (await list(req("/api/agents"))).json(); expect(all.total).toBeGreaterThan(200);
    const f = await (await list(req("/api/agents?useCase=Coding&oss=true&minStars=1000&sort=stars"))).json();
    expect(f.total).toBeGreaterThan(0); f.items.forEach((a: any) => { expect(a.openSource).toBe(true); expect(a.useCases).toContain("Coding"); expect(a.stats.stars).toBeGreaterThanOrEqual(1000); });
    for (let i = 1; i < f.items.length; i++) expect(f.items[i - 1].stats.stars).toBeGreaterThanOrEqual(f.items[i].stats.stars);
    const t = await (await list(req("/api/agents?tool=langchain"))).json(); t.items.forEach((a: any) => expect(a.mentions).toContain("langchain"));
  });
  it("get one / 404", async () => {
    expect((await one(req(""), { params: Promise.resolve({ id: "adala" }) })).status).toBe(200);
    expect((await one(req(""), { params: Promise.resolve({ id: "nope" }) })).status).toBe(404);
  });
  it("graph edges reference nodes", async () => {
    const g = await (await graph(req("/api/graph"))).json(); const ids = new Set(g.nodes.map((n: any) => n.id));
    g.edges.forEach((e: any) => { expect(ids.has(e.source)).toBe(true); expect(ids.has(e.target)).toBe(true); expect(["curated", "inferred"]).toContain(e.kind); });
  });
  it("categories + openapi", async () => { expect((await (await cats()).json()).categories.length).toBeGreaterThan(3); expect((await (await spec()).json()).openapi).toBe("3.1.0"); });
  it("mcp", async () => {
    expect((await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })).json()).result.serverInfo.name).toBe("agent-atlas");
    expect((await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json()).result.tools).toHaveLength(3);
    const c = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_agents", arguments: { q: "browser", limit: 3 } } })).json();
    expect(c.result.isError).toBe(false); expect(c.result.structuredContent.items.length).toBeGreaterThan(0);
    expect((await rpc({ jsonrpc: "2.0", method: "notifications/initialized" })).status).toBe(202);
  });
  it("ask grok disabled without key", async () => { delete process.env.XAI_API_KEY; expect((await ask(new Request("http://t", { method: "POST", body: "{}" }))).status).toBe(503); });
});
