import { withStats, facets, buildGraph, datasetMeta } from "../lib/data";
import Explorer from "../components/Explorer";
export const revalidate = 21600;
export default async function Page() {
  const { agents, meta } = await withStats();
  return <Explorer agents={agents} facets={facets(agents)} graph={buildGraph({ includeAgents: true })} statsMeta={meta} dataset={datasetMeta} askEnabled={!!process.env.XAI_API_KEY} />;
}
