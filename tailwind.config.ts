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
        "plum-soft": "var(--plum-soft)"
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
