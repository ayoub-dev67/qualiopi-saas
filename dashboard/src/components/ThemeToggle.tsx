"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("theme") as Theme | null) || "light";
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } catch {
      setTheme("light");
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", next);
  };

  // Render a stable fallback during SSR/first paint to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Changer de thème"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
      >
        <Sun size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Passer en mode sombre" : "Passer en mode clair"}
      title={theme === "light" ? "Mode sombre" : "Mode clair"}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
