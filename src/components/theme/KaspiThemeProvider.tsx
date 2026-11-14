"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type KaspiTheme = "pearl-light" | "fjord-twilight";

interface KaspiThemeContextValue {
  theme: KaspiTheme;
  setTheme: (theme: KaspiTheme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "kaspi-theme";

const KaspiThemeContext = createContext<KaspiThemeContextValue>({
  theme: "fjord-twilight",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function KaspiThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<KaspiTheme>("fjord-twilight");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const initial: KaspiTheme =
        saved === "pearl-light" || saved === "fjord-twilight" ? saved : "fjord-twilight";
      setThemeState(initial);
      document.documentElement.setAttribute("data-kaspi-theme", initial);
    } catch {
      document.documentElement.setAttribute("data-kaspi-theme", "fjord-twilight");
    }
  }, []);

  const setTheme = useCallback((next: KaspiTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors in restricted environments
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-kaspi-theme", next);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "pearl-light" ? "fjord-twilight" : "pearl-light");
  }, [theme, setTheme]);

  return (
    <KaspiThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </KaspiThemeContext.Provider>
  );
}

export function useKaspiTheme() {
  return useContext(KaspiThemeContext);
}
