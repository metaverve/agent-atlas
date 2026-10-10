import { writeFileSync, readFileSync, existsSync } from "fs";
import { parseReadme } from "../lib/parse";
import stack from "../data/stack-relations.json";
import { fetchStats } from "../lib/github";
const SRC = "https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md";
async function main() {
  let md: string;
  if (process.argv.includes("--offline") && existsSync("data/source-e2b-README.md")) md = readFileSync("data/source-e2b-README.md", "utf8");
  else { const r = await fetch(SRC); if (!r.ok) throw new Error(`fetch ${r.status}`); md = await r.text(); writeFileSync("data/source-e2b-README.md", md); }
  const agents = parseReadme(md, stack.tools);
  if (agents.length < 100) throw new Error(`parse sanity check failed: only ${agents.length}`);
  writeFileSync("data/agents.json", JSON.stringify({ generatedAt: new Date().toISOString(), source: SRC,
    license: "CC BY-NC-SA 4.0 (data derived from e2b-dev/awesome-ai-agents)", count: agents.length, agents }, null, 2) + "\n");
  const repos = [...new Set([...agents.map(a => a.repo), ...stack.tools.map(t => t.repo)].filter(Boolean) as string[])];
  const stats = await fetchStats(repos, process.env.GITHUB_TOKEN);
  if (Object.keys(stats).length) writeFileSync("data/stats-snapshot.json", JSON.stringify({ fetchedAt: new Date().toISOString(), stats }, null, 1) + "\n");
  console.log(`stats for ${Object.keys(stats).length}/${repos.length} repos`);
  console.log(`wrote ${agents.length} agents`);
}
main().catch(e => { console.error(e); process.exit(1); });
