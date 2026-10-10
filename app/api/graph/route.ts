import { buildGraph } from "../../../lib/data";
import { json } from "../../../lib/http";
export function GET(req: Request) { return json(buildGraph({ includeAgents: new URL(req.url).searchParams.get("agents") !== "false" })); }
