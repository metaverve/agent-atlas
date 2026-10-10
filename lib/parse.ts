export type Agent = {
  id: string; name: string; url: string; repo: string | null; description: string;
  category: string[]; useCases: string[]; openSource: boolean; pricing: string;
  tags: string[]; mentions: string[]; links: { label: string; url: string }[]; source: string;
};

const USE_CASES: Record<string, string> = {
  coding: "Coding", debugging: "Coding", github: "Coding", "generating apps": "Coding", "web design": "Design",
  productivity: "Productivity", "personal assistant": "Productivity", "workflow automation": "Productivity",
  "data analysis": "Data analysis", "business intelligence": "Data analysis", research: "Research", science: "Research",
  sales: "Sales", marketing: "Marketing", marketig: "Marketing", "content creation": "Content creation",
  finance: "Finance", hr: "HR", legal: "Legal", education: "Education", design: "Design",
};
const CATS: Record<string, string> = {
  "general purpose": "General purpose", "build-your-own": "Build your own", "build your own": "Build your own",
  "multi-agent": "Multi-agent", "sdk for ai apps": "SDK / Framework", "sdk for agents": "SDK / Framework",
  "tool for agents": "Tool for agents", "supports open-source models": "Open-source models", "no-code": "No-code", "web ui": "Web UI",
};

export function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function githubRepo(u: string): string | null {
  const m = u.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  if (!m || ["sponsors", "orgs", "features", "apps"].includes(m[1])) return null;
  return `${m[1]}/${m[2].replace(/\.git$/, "")}`;
}

export function parseReadme(md: string, tools: { id: string; keywords: string[] }[] = []): Agent[] {
  const md2 = md.replace(/<!--[\s\S]*?-->/g, "");
  const closedIdx = md2.indexOf("# Closed-source projects");
  const re = /^## \[([^\]]+)\]\(([^)]+)\)\s*$/gm;
  const heads: { name: string; url: string; idx: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md2))) heads.push({ name: m[1].trim(), url: m[2].trim(), idx: m.index, end: re.lastIndex });
  const out: Agent[] = []; const seen = new Set<string>();
  heads.forEach((h, i) => {
    const body = md2.slice(h.end, i + 1 < heads.length ? heads[i + 1].idx : md2.length);
    const tagline = (body.split("\n").map(l => l.trim()).find(l => l && !l.startsWith("<") && !l.startsWith("!")) || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    const catLine = (body.match(/### Category\s*\n+([^\n]+)/) || [])[1] || "";
    const raw = catLine.split(",").map(s => s.trim().replace(/^[-*]\s*/, "")).filter(Boolean);
    const category = new Set<string>(), useCases = new Set<string>();
    for (const r of raw) {
      const k = r.toLowerCase().replace(/\s*\(.*\)/, "").trim();
      if (CATS[k]) category.add(CATS[k]); else if (USE_CASES[k]) useCases.add(USE_CASES[k]); else if (k) useCases.add(r[0].toUpperCase() + r.slice(1));
    }
    if (!category.size) category.add("Specialized");
    const linksBlock = (body.match(/### Links\s*\n([\s\S]*?)(\n###|<\/details>|$)/) || [])[1] || "";
    const links = [...linksBlock.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(x => ({ label: x[1].trim(), url: x[2].trim() }));
    const repo = githubRepo(h.url) || links.map(l => githubRepo(l.url)).find(Boolean) || null;
    const openSource = closedIdx < 0 ? true : h.idx < closedIdx;
    let id = slug(h.name); if (seen.has(id)) id = `${id}-${i}`; seen.add(id);
    const pricing = openSource ? "Open source" : "Commercial (see vendor)";
    const low = body.toLowerCase();
    const mentions = tools.filter(t => t.keywords.some(k => new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(low))).map(t => t.id);
    out.push({ id, name: h.name, url: h.url, repo, description: tagline, category: [...category], useCases: [...useCases],
      openSource, pricing, tags: [...category, ...useCases].map(slug), mentions, links, source: "e2b-dev/awesome-ai-agents" });
  });
  return out;
}
