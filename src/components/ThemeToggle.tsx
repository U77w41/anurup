import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Resolved dark/light state (false until mounted, to avoid a hydration flash). */
export function useIsDark() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && resolvedTheme === "dark";
}

/** Sidebar switch, styled like the portfolio's "Dark Mode" toggle. */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const dark = useIsDark();
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("group flex w-full items-center gap-6 text-sm text-muted-foreground transition-colors hover:text-foreground", dark && "font-bold text-primary", className)}
      aria-pressed={dark}
      data-testid="theme-toggle"
    >
      {dark ? <ToggleRight className="h-6 w-6 shrink-0" strokeWidth={1.5} /> : <ToggleLeft className="h-6 w-6 shrink-0" strokeWidth={1.5} />}
      Dark Mode
    </button>
  );
}

/** Compact icon button for the mobile top bar. */
export function ThemeIconButton({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const dark = useIsDark();
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", className)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
