import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Pill-style single-choice control used for presets and modes across tools. */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: { value: NoInfer<T>; label: React.ReactNode; title?: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg border font-medium transition-all",
            size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
            value === o.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, className, htmlFor }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Card wrapping a tool's settings. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-5 rounded-2xl border border-border/70 bg-card p-4 shadow-card sm:p-5", className)}>{children}</div>;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{children}</p>;
}
