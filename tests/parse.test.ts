import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseReadme, githubRepo } from "../lib/parse";
import stack from "../data/stack-relations.json";
const md = readFileSync("data/source-e2b-README.md", "utf8");
describe("parser", () => {
  const a = parseReadme(md, stack.tools);
  it("parses all entries", () => { expect(a.length).toBeGreaterThan(200); });
  it("unique ids", () => { expect(new Set(a.map(x => x.id)).size).toBe(a.length); });
  it("splits open/closed", () => { expect(a.find(x => x.id === "adala")!.openSource).toBe(true); expect(a.filter(x => !x.openSource).length).toBeGreaterThan(50); });
  it("normalizes categories", () => { const ad = a.find(x => x.id === "adala")!; expect(ad.category).toContain("Multi-agent"); expect(ad.repo).toBe("HumanSignal/Adala"); });
  it("no stray markdown", () => { a.forEach(x => [...x.category, ...x.useCases].forEach(c => expect(c).not.toMatch(/^[-*]/))); });
  it("githubRepo", () => { expect(githubRepo("https://github.com/a/b.git")).toBe("a/b"); expect(githubRepo("https://x.com")).toBeNull(); });
  it("parses synthetic", () => {
    const r = parseReadme("# Open-source projects\n## [Foo](https://github.com/o/foo)\nA LangChain agent\n### Category\nCoding, Multi-agent\n# Closed-source projects and companies\n## [Bar](https://bar.ai)\nBar\n### Category\nSales", stack.tools);
    expect(r).toHaveLength(2); expect(r[0].useCases).toEqual(["Coding"]); expect(r[0].mentions).toContain("langchain"); expect(r[1].openSource).toBe(false);
  });
});
