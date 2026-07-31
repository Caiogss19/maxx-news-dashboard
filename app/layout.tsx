import type { Metadata } from "next";
import "./globals.css";
import { LiveIndicator } from "@/components/LiveIndicator";
import { Sidebar, MobileNav } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Maxx News · Newsletter Dashboard · Spark Maxx",
  description: "Analytics da newsletter — integração Beehiiv + RD Station",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Sidebar />

        <div className="md:ml-[228px]">
          <div className="max-w-[1180px] mx-auto px-5 md:px-10 py-8">
            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <header className="flex items-center justify-between gap-4 mb-8">
              <div className="md:hidden flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 15
                  }}
                >
                  S
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Maxx News</div>
              </div>
              <div className="hidden md:block font-mono-tag">
                Growth Ops · newsletter Beehiiv ↔ RD Station
              </div>
              <LiveIndicator />
            </header>

            <MobileNav />

            {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
            {children}

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <footer className="mt-20 pt-8 border-t border-rule">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-ink-mute">
                <div>
                  <div className="font-mono-tag mb-2">Stack</div>
                  <p>n8n · Supabase · Beehiiv · RD Station · Pipedrive</p>
                </div>
                <div>
                  <div className="font-mono-tag mb-2">Atualização</div>
                  <p>
                    Engajamento e rankings: a cada 3 dias. Eventos de inscrição: ao vivo,
                    via WebSocket.
                  </p>
                </div>
                <div>
                  <div className="font-mono-tag mb-2">Fontes</div>
                  <p>
                    <code className="font-mono text-xs">beehiiv_events</code> ·{" "}
                    <code className="font-mono text-xs">beehiiv_post_engagement</code>
                  </p>
                </div>
              </div>
              <div className="mt-8 text-xs text-ink-faint font-mono">
                Spark Maxx · Growth Ops · v0.2
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
