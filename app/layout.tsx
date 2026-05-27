import type { Metadata } from "next";
import "./globals.css";

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
      <body className="grain">{children}</body>
    </html>
  );
}
