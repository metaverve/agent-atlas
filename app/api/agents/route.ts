import { withStats, filterAgents, parseQuery, datasetMeta } from "../../../lib/data";
import { json, CORS } from "../../../lib/http";
export const revalidate = 21600;
export async function GET(req: Request) {
  const { agents, meta } = await withStats();
  const q = parseQuery(new URL(req.url).searchParams);
  const r = filterAgents(agents, q);
  return json({ total: r.total, count: r.items.length, stats: meta, dataset: datasetMeta, items: r.items });
}
export const OPTIONS = () => new Response(null, { headers: CORS });
