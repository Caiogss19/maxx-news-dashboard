import type { Metadata } from "next";
import "./globals.css";
import { Casca } from "@/components/Casca";

export const metadata: Metadata = {
  title: "Maxx News · Spark Maxx",
  description: "Analytics da newsletter — integração Beehiiv + RD Station"
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
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
