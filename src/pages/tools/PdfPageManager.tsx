import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, RotateCw, Trash2, Undo2 } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import PdfThumbnail, { usePdfDoc } from "@/components/pdf/PdfThumbnail";
import { ErrorNote, Panel } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { loadPdfDocument, pageRotation, pdfDocToBlob } from "@/lib/pdf";
import { deriveName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tip } from "@/components/Tip";

interface PageItem {
  key: number;
  /** 1-based page number in the source document. */
  src: number;
  /** Extra rotation added by the user (multiples of 90). */
  rotate: number;
  deleted: boolean;
}

const fresh = (n: number): PageItem[] => Array.from({ length: n }, (_, i) => ({ key: i, src: i + 1, rotate: 0, deleted: false }));

const PdfPageManager = () => {
  const [file, setFile] = useState<File | null>(null);
  const { doc, numPages, error } = usePdfDoc(file);
  const [items, setItems] = useState<PageItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setItems([]);
    setResult(null);
  }, []);
  useIncomingFiles(handleFiles);

  useEffect(() => setItems(fresh(numPages)), [numPages]);
  useEffect(() => setResult(null), [items]);

  const update = (i: number, patch: Partial<PageItem>) => setItems((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (from: number, to: number) =>
    setItems((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const kept = items.filter((p) => !p.deleted);
  const changed = items.some((p, i) => p.src !== i + 1 || p.rotate % 360 !== 0 || p.deleted);

  const exportPdf = useCallback(async () => {
    if (!file || !kept.length) return;
    setBusy(true);
    try {
      const src = await loadPdfDocument(file);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, kept.map((p) => p.src - 1));
      copied.forEach((page, i) => {
        const extra = kept[i].rotate;
        if (extra % 360) page.setRotation(degrees((pageRotation(page) + extra + 360) % 360));
        out.addPage(page);
      });
      setResult({ blob: await pdfDocToBlob(out), name: deriveName(file.name, "organized", "pdf"), note: `${kept.length} of ${items.length} pages` });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [file, kept, items.length]);

  return (
    <Layout title="Organize Pages" description="Drag pages to reorder them, rotate any page, and remove the ones you don’t need. Real page previews, nothing uploaded." width="xl">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Upload a PDF"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setItems([]);
          setResult(null);
        }}
      />
      <ErrorNote>{error}</ErrorNote>

      {file && items.length > 0 && (
        <Panel>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setItems((prev) => prev.map((p) => ({ ...p, rotate: p.rotate - 90 })))}>
              <RotateCcw /> Rotate all left
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setItems((prev) => prev.map((p) => ({ ...p, rotate: p.rotate + 90 })))}>
              <RotateCw /> Rotate all right
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setItems(fresh(numPages))} disabled={!changed}>
              <Undo2 /> Reset
            </Button>
            <span className="ml-auto text-sm text-muted-foreground">
              {kept.length} of {items.length} pages kept · drag to reorder
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((p, i) => (
              <div
                key={p.key}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex != null) move(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={cn(
                  "group relative cursor-grab overflow-hidden rounded-xl border-2 bg-background transition-all active:cursor-grabbing",
                  p.deleted ? "border-dashed border-destructive/50 opacity-50" : "border-border hover:border-primary/50",
                  overIndex === i && dragIndex !== i && "border-primary ring-2 ring-primary/30",
                  dragIndex === i && "opacity-40",
                )}
                data-testid="page-card"
              >
                <div className="relative p-2">
                  <PdfThumbnail file={file} doc={doc} page={p.src} width={160} rotate={p.rotate} className="rounded-md" />
                  {p.deleted && (
                    <div className="absolute inset-2 flex items-center justify-center rounded-md bg-destructive/10">
                      <Trash2 className="h-8 w-8 text-destructive" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded bg-black/60 px-1.5 text-[11px] font-semibold text-white">{i + 1}</span>
                  {p.src !== i + 1 && <span className="absolute right-3 top-3 rounded bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">was {p.src}</span>}
                </div>
                <div className="flex items-center justify-between border-t border-border bg-muted/40 px-1 py-1">
                  <MiniBtn label="Move left" onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ArrowLeft />
                  </MiniBtn>
                  <MiniBtn label="Rotate left" onClick={() => update(i, { rotate: p.rotate - 90 })}>
                    <RotateCcw />
                  </MiniBtn>
                  <MiniBtn label={p.deleted ? "Restore page" : "Delete page"} onClick={() => update(i, { deleted: !p.deleted })} danger={!p.deleted}>
                    {p.deleted ? <Undo2 /> : <Trash2 />}
                  </MiniBtn>
                  <MiniBtn label="Rotate right" onClick={() => update(i, { rotate: p.rotate + 90 })}>
                    <RotateCw />
                  </MiniBtn>
                  <MiniBtn label="Move right" onClick={() => move(i, i + 1)} disabled={i === items.length - 1}>
                    <ArrowRight />
                  </MiniBtn>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={exportPdf} disabled={busy || !kept.length} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Building PDF…" : `Save ${kept.length} page${kept.length === 1 ? "" : "s"}`}
          </Button>
        </Panel>
      )}

      {result && <ResultPanel toolId="pdf-page-manager" items={[result]} />}
    </Layout>
  );
};

function MiniBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Tip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={cn("rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background disabled:opacity-30 [&_svg]:h-4 [&_svg]:w-4", danger ? "hover:text-destructive" : "hover:text-foreground")}
      >
        {children}
      </button>
    </Tip>
  );
}

export default PdfPageManager;
