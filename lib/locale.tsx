"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { LocalizedString } from "@/types/cms";

export type Locale = "en" | "af";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (value: LocalizedString | string | undefined | null) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.en;
  },
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (globalThis.localStorage !== undefined) {
      const stored = globalThis.localStorage.getItem("yoros-lang");
      if (stored === "en" || stored === "af") return stored;
    }
    return "en";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("yoros-lang", next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (value: LocalizedString | string | undefined | null): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      return value[locale] || value.en;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
