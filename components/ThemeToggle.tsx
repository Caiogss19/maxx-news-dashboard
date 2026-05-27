"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as "light" | "dark") ?? "light";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  const switchTo = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Theme switcher">
      <button
        className={`theme-toggle-opt ${theme === "light" ? "active" : ""}`}
        onClick={() => switchTo("light")}
        type="button"
      >
        <span aria-hidden>☀</span>Claro
      </button>
      <button
        className={`theme-toggle-opt ${theme === "dark" ? "active" : ""}`}
        onClick={() => switchTo("dark")}
        type="button"
      >
        <span aria-hidden>☾</span>Escuro
      </button>
    </div>
  );
}
