"use client";
import { useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";
import StackGraph, { LAYER_COLORS } from "./StackGraph";
import type { AgentWithStats, GraphNode, GraphEdge, StatsMeta } from "../lib/data";

type Props = { agents: AgentWithStats[]; facets: { categories: { name: string; count: number }[]; useCases: { name: string; count: number }[] };
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; note: string }; statsMeta: StatsMeta; dataset: { generatedAt: string; count: number; license: string }; askEnabled: boolean };

const fmt = (n?: number | null) => n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
const ago = (d?: string | null) => { if (!d) return "—"; const days = Math.round((Date.now() - +new Date(d)) / 864e5); return days < 1 ? "today" : days < 60 ? `${days}d ago` : `${Math.round(days / 30)}mo ago`; };

export default function Explorer({ agents, facets, graph, statsMeta, dataset, askEnabled }: Props) {
  const [q, setQ] = useState(""); const [cats, setCats] = useState<string[]>([]); const [ucs, setUcs] = useState<string[]>([]);
  const [oss, setOss] = useState<"all" | "true" | "false">("all"); const [lang, setLang] = useState(""); const [minS, setMinS] = useState(""); const [maxS, setMaxS] = useState("");
  const [sort, setSort] = useState("stars"); const [view, setView] = useState<"cards" | "table">("cards"); const [tool, setTool] = useState<string | null>(null);
  const [showAllUc, setShowAllUc] = useState(false);
  const fuse = useMemo(() => new Fuse(agents, { keys: [{ name: "name", weight: 3 }, "description", "category", "useCases", "repo", "stats.language"], threshold: 0.35, ignoreLocation: true }), [agents]);
  const langs = useMemo(() => { const m: Record<string, number> = {}; agents.forEach(a => a.stats?.language && (m[a.stats.language] = (m[a.stats.language] || 0) + 1)); return Object.entries(m).sort((a, b) => b[1] - a[1]); }, [agents]);
  const toolNode = graph.nodes.find(n => n.id === tool);
  const list = useMemo(() => {
    let r = q.trim() ? fuse.search(q.trim()).map(x => x.item) : agents;
    if (cats.length) r = r.filter(a => cats.some(c => a.category.includes(c)));
    if (ucs.length) r = r.filter(a => ucs.some(c => a.useCases.includes(c)));
    if (oss !== "all") r = r.filter(a => a.openSource === (oss === "true"));
    if (lang) r = r.filter(a => a.stats?.language === lang);
    if (minS) r = r.filter(a => (a.stats?.stars ?? -1) >= +minS);
    if (maxS) r = r.filter(a => a.stats && a.stats.stars <= +maxS);
    if (tool) r = tool.startsWith("agent:") ? r.filter(a => `agent:${a.id}` === tool) : r.filter(a => a.mentions.includes(tool));
    if (!q.trim() || sort !== "relevance") r = [...r].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "recent" ? (b.stats?.pushedAt ?? "").localeCompare(a.stats?.pushedAt ?? "") : sort === "forks" ? (b.stats?.forks ?? -1) - (a.stats?.forks ?? -1) : sort === "relevance" ? 0 : (b.stats?.stars ?? -1) - (a.stats?.stars ?? -1));
    return r;
  }, [agents, fuse, q, cats, ucs, oss, lang, minS, maxS, sort, tool]);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const onSelect = useCallback((id: string) => setTool(t => (t === id ? null : id)), []);
  const reset = () => { setQ(""); setCats([]); setUcs([]); setOss("all"); setLang(""); setMinS(""); setMaxS(""); setTool(null); };
  const apiHref = `/api/agents?${new URLSearchParams({ ...(q && { q }), ...(cats.length && { category: cats.join(",") }), ...(ucs.length && { useCase: ucs.join(",") }), ...(oss !== "all" && { oss }), ...(lang && { language: lang }), ...(minS && { minStars: minS }), ...(maxS && { maxStars: maxS }), ...(tool && !tool.startsWith("agent:") && { tool }), sort: sort === "relevance" ? "stars" : sort })}`;

  return <div className="wrap">
    <header className="top">
      <div className="logo">◈ <span>Agent Atlas</span> <span className="note" style={{ fontWeight: 400 }}>the AI agent ecosystem, live</span></div>
      <nav className="nav"><a href="/docs">API & MCP docs</a><a href="/api/agents">JSON</a><a href="/llms.txt">llms.txt</a><a href="https://github.com/metaverve/agent-atlas">GitHub</a></nav>
    </header>
    <div className="meta" style={{ marginTop: 8 }}>
      <span>{dataset.count} agents</span><span>{agents.filter(a => a.repo).length} GitHub repos tracked</span>
      <span data-testid="stats-mode">stars: {statsMeta.mode === "live" ? "live" : "snapshot"} · {new Date(statsMeta.fetchedAt).toISOString().slice(0, 16).replace("T", " ")} UTC</span>
      <span>source: <a href="https://github.com/e2b-dev/awesome-ai-agents">e2b-dev/awesome-ai-agents</a> (CC BY-NC-SA 4.0)</span>
    </div>

    <section className="panel graphbox" style={{ marginTop: 16 }}>
      <div className="legend">{Object.entries(LAYER_COLORS).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}<span style={{ marginLeft: 12 }}>── curated · ┄ inferred</span>
        <div style={{ marginTop: 4 }}>Click a node to filter the list · drag to move · scroll to zoom</div></div>
      <StackGraph nodes={graph.nodes} edges={graph.edges} selected={tool} onSelect={onSelect} />
    </section>

    <div className="grid">
      <aside className="panel side">
        <h4>Type</h4>{facets.categories.map(c => <span key={c.name} className={`pill click ${cats.includes(c.name) ? "on" : ""}`} onClick={() => toggle(cats, setCats, c.name)}>{c.name} {c.count}</span>)}
        <h4>Use case</h4>{(showAllUc ? facets.useCases : facets.useCases.slice(0, 12)).map(c => <span key={c.name} className={`pill click ${ucs.includes(c.name) ? "on" : ""}`} onClick={() => toggle(ucs, setUcs, c.name)}>{c.name} {c.count}</span>)}
        {facets.useCases.length > 12 && <a style={{ cursor: "pointer", fontSize: 12 }} onClick={() => setShowAllUc(!showAllUc)}>{showAllUc ? "fewer" : `+${facets.useCases.length - 12} more`}</a>}
        <h4>License</h4><select aria-label="license" value={oss} onChange={e => setOss(e.target.value as any)}><option value="all">All</option><option value="true">Open source</option><option value="false">Closed source</option></select>
        <h4>Language</h4><select aria-label="language" value={lang} onChange={e => setLang(e.target.value)}><option value="">Any</option>{langs.map(([l, n]) => <option key={l} value={l}>{l} ({n})</option>)}</select>
        <h4>Stars</h4><div style={{ display: "flex", gap: 6 }}><input aria-label="min stars" placeholder="min" value={minS} onChange={e => setMinS(e.target.value.replace(/\D/g, ""))} /><input aria-label="max stars" placeholder="max" value={maxS} onChange={e => setMaxS(e.target.value.replace(/\D/g, ""))} /></div>
        <h4>Ask Grok</h4>{askEnabled ? <a href="/docs#ask">Stack recommender</a> : <div className="banner">Disabled: no XAI_API_KEY on this deployment. Nothing is simulated.</div>}
      </aside>
      <main>
        <input className="search" placeholder="Fuzzy search 214 agents: 'browsr automaton', 'multi agent research', 'python sql'…" value={q} onChange={e => setQ(e.target.value)} data-testid="search" />
        <div className="bar">
          <span data-testid="count"><b>{list.length}</b> results</span>
          {toolNode && <span className="pill on" onClick={() => setTool(null)} data-testid="tool-filter">stack: {toolNode.name} ✕</span>}
          <select aria-label="sort" value={sort} onChange={e => setSort(e.target.value)}><option value="stars">★ Stars</option><option value="forks">Forks</option><option value="recent">Last commit</option><option value="name">Name</option><option value="relevance">Relevance</option></select>
          <button className={`btn ${view === "cards" ? "on" : ""}`} onClick={() => setView("cards")}>Cards</button><button className={`btn ${view === "table" ? "on" : ""}`} onClick={() => setView("table")}>Table</button>
          <button className="btn" onClick={reset}>Reset</button><a className="note" href={apiHref} data-testid="api-link">this view as JSON →</a>
        </div>
        {view === "cards" ? <div className="cards">{list.map(a => <article className="card" key={a.id} data-testid="card">
          <h3><a href={a.url} target="_blank" rel="noreferrer">{a.name}</a></h3><p>{a.description}</p>
          <div>{a.category.map(c => <span className="pill" key={c}>{c}</span>)}{a.useCases.map(c => <span className="pill" key={c}>{c}</span>)}</div>
          <div className="meta" style={{ marginTop: 8 }}><span className="star">★ {fmt(a.stats?.stars)}</span><span>⑂ {fmt(a.stats?.forks)}</span><span>{a.stats?.language ?? (a.openSource ? "" : "closed source")}</span><span>{a.stats ? `pushed ${ago(a.stats.pushedAt)}` : ""}</span>{a.stats?.archived && <span style={{ color: "var(--warn)" }}>archived</span>}</div>
        </article>)}</div>
        : <div className="panel" style={{ padding: 0 }}><table><thead><tr><th>Name</th><th>Type</th><th>Use cases</th><th>★</th><th>Forks</th><th>Lang</th><th>Last commit</th></tr></thead><tbody>
          {list.map(a => <tr key={a.id}><td><a href={a.url} target="_blank" rel="noreferrer">{a.name}</a><div className="note">{a.description}</div></td><td>{a.category.join(", ")}</td><td>{a.useCases.join(", ")}</td><td className="star">{fmt(a.stats?.stars)}</td><td>{fmt(a.stats?.forks)}</td><td>{a.stats?.language ?? "—"}</td><td>{ago(a.stats?.pushedAt)}</td></tr>)}</tbody></table></div>}
      </main>
    </div>
    <footer>{graph.note} Data © e2b-dev/awesome-ai-agents contributors, CC BY-NC-SA 4.0; adapted (parsed, normalized, enriched). Code MIT. Built by RANDYLAND/tech.</footer>
  </div>;
}
