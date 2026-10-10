import "./globals.css";
export const metadata = { title: "Agent Atlas — the AI agent ecosystem, live", description: "214 AI agents with live GitHub stars, stack graph, JSON API and MCP server." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
