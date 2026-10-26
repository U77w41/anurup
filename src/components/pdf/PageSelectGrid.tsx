import { useRef } from "react";
import { Check } from "lucide-react";
import PdfThumbnail from "@/components/pdf/PdfThumbnail";
import type { PDFDocumentProxy } from "@/lib/pdfRender";
import { cn } from "@/lib/utils";

interface PageSelectGridProps {
  file: Blob;
  doc: PDFDocumentProxy | null;
  numPages: number;
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}

/** Thumbnail grid where pages are toggled by click; Shift+click selects a run. */
const PageSelectGrid = ({ file, doc, numPages, selected, onChange }: PageSelectGridProps) => {
  const last = useRef<number | null>(null);

  const click = (page: number, shift: boolean) => {
    const next = new Set(selected);
    if (shift && last.current != null) {
      const [a, b] = [Math.min(last.current, page), Math.max(last.current, page)];
      const on = !selected.has(page);
      for (let p = a; p <= b; p++) {
        if (on) next.add(p);
        else next.delete(p);
      }
    } else if (next.has(page)) next.delete(page);
    else next.add(page);
    last.current = page;
    onChange(next);
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
        const on = selected.has(p);
        return (
          <button
            key={p}
            type="button"
            onClick={(e) => click(p, e.shiftKey)}
            aria-pressed={on}
            aria-label={`Page ${p}`}
            className={cn(
              "group relative overflow-hidden rounded-lg border-2 bg-white transition-all",
              on ? "border-primary shadow-card" : "border-border opacity-60 hover:opacity-100",
            )}
          >
            <PdfThumbnail file={file} doc={doc} page={p} width={140} />
            <span className={cn("absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-primary-foreground", on ? "border-primary bg-primary" : "border-neutral-300 bg-white/80")}>
              {on && <Check className="h-3 w-3" />}
            </span>
            <span className="absolute bottom-0 left-0 right-0 bg-black/55 py-0.5 text-center text-[11px] font-medium text-white">{p}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PageSelectGrid;
