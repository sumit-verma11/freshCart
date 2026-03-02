"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  // On mount: read saved preference
  useEffect(() => {
    const saved = (localStorage.getItem("fc-theme") as Theme) || "system";
    setThemeState(saved);
  }, []);

  // Apply class to <html> whenever theme or system preference changes
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(t: Theme, systemDark: boolean) {
      const isDark = t === "dark" || (t === "system" && systemDark);
      root.classList.toggle("dark", isDark);
      setResolved(isDark ? "dark" : "light");
    }

    apply(theme, mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(theme, e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    localStorage.setItem("fc-theme", t);
    setThemeState(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
