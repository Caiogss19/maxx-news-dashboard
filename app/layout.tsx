import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiveIndicator } from "@/components/LiveIndicator";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Maxx News · Newsletter Dashboard · Spark Maxx",
  description: "Real-time newsletter analytics — Beehiiv + RD Station integration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'light';
                  document.documentElement.setAttribute('data-theme', t);
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="grain">
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 py-10">
          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-ink text-bg-paper flex items-center justify-center font-serif-italic text-base">
                M
              </div>
              <div>
                <div className="font-mono-tag">Spark Maxx · Growth Ops</div>
                <div className="font-display text-base">Maxx News · Newsletter Dashboard</div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <LiveIndicator />
              <ThemeToggle />
            </div>
          </header>

          {/* ── NAV ────────────────────────────────────────────────────── */}
          <Nav />

          {/* ── PAGE CONTENT ───────────────────────────────────────────── */}
          {children}

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <footer className="mt-20 pt-8 border-t border-rule">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-ink-mute">
              <div>
                <div className="font-mono-tag mb-2">Stack</div>
                <p>n8n · Supabase · Beehiiv · RD Station · Pipedrive</p>
              </div>
              <div>
                <div className="font-mono-tag mb-2">Refresh</div>
                <p>Server: a cada 30s. Live: WebSocket Supabase Realtime (instantâneo).</p>
              </div>
              <div>
                <div className="font-mono-tag mb-2">Fontes</div>
                <p>
                  <code className="font-mono text-xs">beehiiv_events</code> ·{" "}
                  <code className="font-mono text-xs">beehiiv_sync_outbound</code>
                </p>
              </div>
            </div>
            <div className="mt-8 text-xs text-ink-faint font-mono uppercase tracking-wider">
              Spark Maxx · Growth Ops · v0.1
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
