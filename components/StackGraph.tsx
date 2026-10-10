"use client";
import { useEffect, useRef } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import type { GraphNode, GraphEdge } from "../lib/data";

export const LAYER_COLORS: Record<string, string> = { agent: "#5b6478", framework: "#7c5cff", model: "#ff5ca8", memory: "#20d3c2", tooling: "#ffb84d", eval: "#4da3ff", deployment: "#8be36b" };
type N = GraphNode & SimulationNodeDatum;

export default function StackGraph({ nodes, edges, selected, onSelect }: { nodes: GraphNode[]; edges: GraphEdge[]; selected: string | null; onSelect: (id: string) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current!; const W = svg.clientWidth || 900, H = svg.clientHeight || 520;
    const ns: N[] = [...nodes].sort((a, b) => (a.layer === "agent" ? 0 : 1) - (b.layer === "agent" ? 0 : 1)).map(n => ({ ...n })); const byId = new Map(ns.map(n => [n.id, n]));
    const ls = edges.filter(e => byId.has(e.source) && byId.has(e.target)).map(e => ({ ...e }));
    const layers = ["agent", "framework", "model", "memory", "tooling", "eval", "deployment"];
    const NS = "http://www.w3.org/2000/svg"; svg.innerHTML = "";
    const g = document.createElementNS(NS, "g"); svg.appendChild(g);
    let tx = 0, ty = 0, k = 1; const apply = () => g.setAttribute("transform", `translate(${tx},${ty}) scale(${k})`);
    svg.onwheel = e => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 0.9; k = Math.max(.3, Math.min(4, k * f)); apply(); };
    const lines = ls.map(e => { const l = document.createElementNS(NS, "line"); l.setAttribute("stroke", e.kind === "curated" ? "#6d5bd0" : "#2b3247"); l.setAttribute("stroke-width", e.kind === "curated" ? "1.6" : "0.8"); if (e.kind === "inferred") l.setAttribute("stroke-dasharray", "3 3"); g.appendChild(l); return l; });
    const circles = ns.map(n => {
      const grp = document.createElementNS(NS, "g"); grp.style.cursor = "pointer"; grp.setAttribute("data-node", n.id);
      const c = document.createElementNS(NS, "circle"); const r = n.layer === "agent" ? 4 : 8 + Math.sqrt(n.agentCount || 0) * 2.2;
      c.setAttribute("r", String(r)); c.setAttribute("fill", LAYER_COLORS[n.layer]); c.setAttribute("stroke", "#0007");
      const t = document.createElementNS(NS, "title"); t.textContent = `${n.name} (${n.layer})`; c.appendChild(t); grp.appendChild(c);
      if (n.layer !== "agent") { const tx2 = document.createElementNS(NS, "text"); tx2.textContent = n.name; tx2.setAttribute("x", String(r + 3)); tx2.setAttribute("y", "4"); tx2.setAttribute("fill", "#cfd5e6"); tx2.setAttribute("font-size", "11"); grp.appendChild(tx2); }
      grp.addEventListener("click", ev => { ev.stopPropagation(); onSelect(n.id); });
      let drag = false; grp.addEventListener("pointerdown", ev => { drag = true; grp.setPointerCapture(ev.pointerId); sim.alphaTarget(.3).restart(); });
      grp.addEventListener("pointermove", ev => { if (!drag) return; const b = svg.getBoundingClientRect(); n.fx = (ev.clientX - b.left - tx) / k; n.fy = (ev.clientY - b.top - ty) / k; });
      grp.addEventListener("pointerup", () => { drag = false; n.fx = n.fy = null; sim.alphaTarget(0); });
      g.appendChild(grp); return { grp, r };
    });
    const sim = forceSimulation(ns)
      .force("link", forceLink(ls as any).id((d: any) => d.id).distance((l: any) => l.kind === "curated" ? 90 : 45).strength(.4))
      .force("charge", forceManyBody().strength((d: any) => d.layer === "agent" ? -18 : -260))
      .force("x", forceX((d: any) => (layers.indexOf(d.layer) / (layers.length - 1)) * W * .8 + W * .1).strength(.05))
      .force("y", forceY(H / 2).strength(.08)).force("center", forceCenter(W / 2, H / 2)).force("collide", forceCollide((d: any) => d.layer === "agent" ? 6 : 22))
      .on("tick", () => {
        ls.forEach((e: any, i) => { lines[i].setAttribute("x1", e.source.x); lines[i].setAttribute("y1", e.source.y); lines[i].setAttribute("x2", e.target.x); lines[i].setAttribute("y2", e.target.y); });
        ns.forEach((n, i) => circles[i].grp.setAttribute("transform", `translate(${n.x},${n.y})`));
      });
    return () => { sim.stop(); };
  }, [nodes, edges, onSelect]);
  useEffect(() => { ref.current?.querySelectorAll("g[data-node] > circle").forEach(c => { const on = c.parentElement!.getAttribute("data-node") === selected; c.setAttribute("stroke", on ? "#fff" : "#0007"); c.setAttribute("stroke-width", on ? "3" : "1"); }); }, [selected]);
  return <svg ref={ref} data-testid="stack-graph" />;
}
