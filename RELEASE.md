RELEASE agent-atlas v1.0.0  Sat Oct 10 2026 PT
Sign-off: Andrew Crosby, Sat Oct 10 2026 11:14 AM PT — "build the dopest version possible: fork or create a new enhanced GitHub repo for AI agent ecosystem. Make it include live star counts via API, advanced search/filter by category/use case, interactive graph of how tools connect in a stack, JSON API for data, perhaps a web UI demo using Vercel or similar if possible. Integrate any relevant Grok tools or make it agent-friendly. Report back with the repo link and key improvements."
Changed: new public repo + Vercel app: 214-agent dataset parsed from e2b-dev/awesome-ai-agents; live GitHub stars/forks/language/last commit (GraphQL, 6h cache, snapshot fallback); fuzzy search + type/use-case/OSS/language/star filters, 5 sorts, card/table; d3-force stack graph (click filters); REST API + OpenAPI 3.1; /llms.txt; MCP server /api/mcp (search_agents, get_agent, get_stack); weekly refresh Action.
Still fake/mocked: none. Agent→tool graph edges are keyword-INFERRED (dashed, labeled); curated edges are hand-picked. "pricing" only says open source vs commercial (source has no prices).
Needs key/secret: GITHUB_TOKEN — Vercel env (server) — without it the stats snapshot is served. XAI_API_KEY — Vercel env — without it Ask Grok is disabled (503, labeled in UI).
Known issues: data licence is CC BY-NC-SA 4.0 (non-commercial) — this app must not be monetized. Graph is dense at small widths.
Gated next: adding XAI_API_KEY (spend) — Andrew. Custom domain — Andrew.
Proof: docs/screenshots/, https://agent-atlas-kohl.vercel.app
