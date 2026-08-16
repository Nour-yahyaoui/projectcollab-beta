"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Renders nothing until mounted — next-themes can't know the resolved
 * theme during SSR, and rendering the wrong icon for a frame is worse
 * than a brief blank space. The <html> class itself is already correct
 * from first paint (next-themes sets it via an inline script), so this
 * only affects the icon inside the button, not any layout shift.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
    >
      {mounted && (theme === "dark" ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />)}
    </button>
  );
}
