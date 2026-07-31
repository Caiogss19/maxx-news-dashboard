import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-paper": "var(--bg-paper)",
        "bg-soft": "var(--bg-soft)",
        ink: "var(--ink)",
        "ink-mute": "var(--ink-mute)",
        "ink-faint": "var(--ink-faint)",
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        crimson: "var(--crimson)",
        "crimson-soft": "var(--crimson-soft)",
        amber: "var(--amber)",
        "amber-soft": "var(--amber-soft)",
        olive: "var(--olive)",
        "olive-soft": "var(--olive-soft)",
        navy: "var(--navy)",
        "navy-soft": "var(--navy-soft)",
        plum: "var(--plum)",
        "plum-soft": "var(--plum-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        accent: "var(--accent)",
        ok: "var(--ok)"
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
