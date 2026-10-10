import { withStats } from "../../../../lib/data";
import { json } from "../../../../lib/http";
export const revalidate = 21600;
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { agents, meta } = await withStats();
  const a = agents.find(x => x.id === id);
  return a ? json({ ...a, statsMode: meta.mode }) : json({ error: "not_found", id }, { status: 404 });
}
