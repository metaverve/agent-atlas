export type RepoStats = { stars: number; forks: number; language: string | null; pushedAt: string | null; archived: boolean };

/** Batched GitHub GraphQL lookup (needs a token). Returns {} on failure so callers can fall back to the snapshot. */
export async function fetchStats(repos: string[], token?: string, init?: RequestInit & { next?: { revalidate: number } }): Promise<Record<string, RepoStats>> {
  const out: Record<string, RepoStats> = {};
  if (!token) return out;
  for (let i = 0; i < repos.length; i += 60) {
    const chunk = repos.slice(i, i + 60);
    const q = chunk.map((r, j) => {
      const [o, n] = r.split("/");
      return `r${j}: repository(owner: ${JSON.stringify(o)}, name: ${JSON.stringify(n)}) { nameWithOwner stargazerCount forkCount isArchived pushedAt primaryLanguage { name } }`;
    }).join("\n");
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST", headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "agent-atlas" },
        body: JSON.stringify({ query: `{ ${q} }` }), ...init,
      });
      if (!res.ok) continue;
      const j = await res.json();
      chunk.forEach((r, k) => {
        const d = j.data?.[`r${k}`];
        if (d) out[r.toLowerCase()] = { stars: d.stargazerCount, forks: d.forkCount, language: d.primaryLanguage?.name ?? null, pushedAt: d.pushedAt, archived: d.isArchived };
      });
    } catch { /* fall through to snapshot */ }
  }
  return out;
}
