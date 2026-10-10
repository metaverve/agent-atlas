import dataset from "../data/agents.json";
import snapshot from "../data/stats-snapshot.json";
import stack from "../data/stack-relations.json";
import { fetchStats, type RepoStats } from "./github";
import type { Agent } from "./parse";

export type AgentWithStats = Agent & { stats: RepoStats | null };
export type StatsMeta = { mode: "live" | "snapshot"; fetchedAt: string };
export const REVALIDATE = 21600; // 6h

export const agents = dataset.agents as Agent[];
export const datasetMeta = { generatedAt: dataset.generatedAt, source: dataset.source, license: dataset.license, count: dataset.count };

let mem: { at: number; stats: Record<string, RepoStats>; meta: StatsMeta } | null = null;

export async function getStats(): Promise<{ stats: Record<string, RepoStats>; meta: StatsMeta }> {
  if (mem && Date.now() - mem.at < REVALIDATE * 1000) return mem;
  const snap = snapshot.stats as Record<string, RepoStats>;
  const repos = [...new Set(agents.map(a => a.repo).filter(Boolean) as string[])];
  const live = process.env.NODE_ENV === "test" ? {} : await fetchStats(repos, process.env.GITHUB_TOKEN, { next: { revalidate: REVALIDATE } });
  const ok = Object.keys(live).length > repos.length * 0.5;
  mem = { at: Date.now(), stats: ok ? { ...snap, ...live } : snap, meta: ok ? { mode: "live", fetchedAt: new Date().toISOString() } : { mode: "snapshot", fetchedAt: snapshot.fetchedAt } };
  return mem;
}

export async function withStats(): Promise<{ agents: AgentWithStats[]; meta: StatsMeta }> {
  const { stats, meta } = await getStats();
  return { agents: agents.map(a => ({ ...a, stats: a.repo ? stats[a.repo.toLowerCase()] ?? null : null })), meta };
}

export type Query = { q?: string; category?: string[]; useCase?: string[]; oss?: "true" | "false"; language?: string[]; minStars?: number; maxStars?: number; tool?: string; sort?: "stars" | "name" | "recent" | "forks"; limit?: number; offset?: number };

export function parseQuery(sp: URLSearchParams): Query {
  const list = (k: string) => sp.getAll(k).flatMap(v => v.split(",")).map(s => s.trim()).filter(Boolean);
  const num = (k: string) => (sp.get(k) != null && sp.get(k) !== "" && !isNaN(Number(sp.get(k))) ? Number(sp.get(k)) : undefined);
  const oss = sp.get("oss");
  return { q: sp.get("q") ?? undefined, category: list("category"), useCase: list("useCase"), language: list("language"),
    oss: oss === "true" || oss === "false" ? oss : undefined, minStars: num("minStars"), maxStars: num("maxStars"), tool: sp.get("tool") ?? undefined,
    sort: (["stars", "name", "recent", "forks"] as const).find(s => s === sp.get("sort")), limit: num("limit"), offset: num("offset") };
}

const ieq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function filterAgents(list: AgentWithStats[], q: Query) {
  let r = list;
  if (q.q) { const t = q.q.toLowerCase().split(/\s+/).filter(Boolean);
    r = r.filter(a => { const h = `${a.name} ${a.description} ${a.category.join(" ")} ${a.useCases.join(" ")} ${a.repo ?? ""} ${a.stats?.language ?? ""}`.toLowerCase(); return t.every(w => h.includes(w)); }); }
  if (q.category?.length) r = r.filter(a => q.category!.some(c => a.category.some(x => ieq(x, c))));
  if (q.useCase?.length) r = r.filter(a => q.useCase!.some(c => a.useCases.some(x => ieq(x, c))));
  if (q.language?.length) r = r.filter(a => a.stats?.language && q.language!.some(l => ieq(l, a.stats!.language!)));
  if (q.oss) r = r.filter(a => a.openSource === (q.oss === "true"));
  if (q.minStars != null) r = r.filter(a => (a.stats?.stars ?? -1) >= q.minStars!);
  if (q.maxStars != null) r = r.filter(a => a.stats != null && a.stats.stars <= q.maxStars!);
  if (q.tool) r = r.filter(a => a.mentions.includes(q.tool!));
  const s = q.sort ?? "stars";
  r = [...r].sort((a, b) => s === "name" ? a.name.localeCompare(b.name) : s === "recent" ? (b.stats?.pushedAt ?? "").localeCompare(a.stats?.pushedAt ?? "")
    : s === "forks" ? (b.stats?.forks ?? -1) - (a.stats?.forks ?? -1) : (b.stats?.stars ?? -1) - (a.stats?.stars ?? -1));
  const total = r.length; const off = q.offset ?? 0;
  return { total, items: r.slice(off, q.limit ? off + q.limit : undefined) };
}

export function facets(list: Agent[]) {
  const c = (f: (a: Agent) => string[]) => { const m: Record<string, number> = {}; list.forEach(a => f(a).forEach(k => (m[k] = (m[k] || 0) + 1))); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })); };
  return { categories: c(a => a.category), useCases: c(a => a.useCases) };
}

export type GraphNode = { id: string; name: string; layer: string; agentCount?: number; repo?: string | null };
export type GraphEdge = { source: string; target: string; kind: "curated" | "inferred" };

export function buildGraph(opts: { includeAgents?: boolean } = {}) {
  const nodes: GraphNode[] = stack.tools.map(t => ({ id: t.id, name: t.name, layer: t.layer, repo: t.repo, agentCount: agents.filter(a => a.mentions.includes(t.id)).length }));
  const edges: GraphEdge[] = stack.edges.map(e => ({ source: e.from, target: e.to, kind: "curated" as const }));
  if (opts.includeAgents) for (const a of agents) if (a.mentions.length) {
    nodes.push({ id: `agent:${a.id}`, name: a.name, layer: "agent", repo: a.repo });
    a.mentions.forEach(m => edges.push({ source: `agent:${a.id}`, target: m, kind: "inferred" }));
  }
  return { layers: stack.layers, note: stack.note, nodes, edges };
}

export function getStack(toolOrAgent: string) {
  const g = buildGraph({ includeAgents: true });
  const id = g.nodes.find(n => n.id === toolOrAgent || n.id === `agent:${toolOrAgent}`)?.id;
  if (!id) return null;
  const edges = g.edges.filter(e => e.source === id || e.target === id);
  const ids = new Set(edges.flatMap(e => [e.source, e.target]));
  return { center: g.nodes.find(n => n.id === id)!, nodes: g.nodes.filter(n => ids.has(n.id)), edges };
}
