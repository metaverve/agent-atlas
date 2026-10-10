import { agents, facets } from "../../../lib/data";
import { json } from "../../../lib/http";
export const dynamic = "force-static";
export function GET() { return json(facets(agents)); }
