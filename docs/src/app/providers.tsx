"use client";

import { createContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";

function usePrevious<T>(value: T) {
  let ref = useRef<T>(null!);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function ThemeWatcher() {
  let { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const controller = new AbortController();
    let media = window.matchMedia("(prefers-color-scheme: dark)");

    function onMediaChange() {
      let systemTheme = media.matches ? "dark" : "light";
      if (resolvedTheme === systemTheme) {
        setTheme("system");
      }
    }

    onMediaChange();
    media.addEventListener("change", onMediaChange, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [resolvedTheme, setTheme]);

  return null;
}

export const AppContext = createContext<{ previousPathname?: string }>({});

export function Providers({ children }: { children: React.ReactNode }) {
  let pathname = usePathname();
  let previousPathname = usePrevious(pathname);

  return (
    <AppContext.Provider value={{ previousPathname }}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <ThemeWatcher />
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
}
