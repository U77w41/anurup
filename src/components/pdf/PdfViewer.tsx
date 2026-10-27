import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { describePdfError, openPdf, type PDFDocumentProxy } from "@/lib/pdfRender";
import { cn } from "@/lib/utils";
import { Tip } from "@/components/Tip";

interface PdfViewerProps {
  file: Blob;
  name?: string;
  className?: string;
  /** CSS height of the scroll area. */
  height?: string;
  onLoaded?: (pageCount: number) => void;
  /** Show the "open full screen" button. */
  expandable?: boolean;
}

interface PageSize {
  width: number;
  height: number;
}

/** Lazily-rendered, scrollable PDF preview with page navigation and zoom. */
const PdfViewer = ({ file, name, className, height = "70vh", onLoaded, expandable = true }: PdfViewerProps) => {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;
    setDoc(null);
    setSizes([]);
    setError(null);
    setCurrent(1);
    (async () => {
      try {
        opened = await openPdf(file);
        const s: PageSize[] = [];
        for (let i = 1; i <= opened.numPages; i++) {
          const p = await opened.getPage(i);
          const v = p.getViewport({ scale: 1 });
          s.push({ width: v.width, height: v.height });
        }
        if (cancelled) return;
        setSizes(s);
        setDoc(opened);
        onLoadedRef.current?.(opened.numPages);
      } catch (e) {
        if (!cancelled) setError(describePdfError(e));
      }
    })();
    return () => {
      cancelled = true;
      if (opened) void opened.destroy();
    };
  }, [file]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxPageWidth = useMemo(() => Math.max(1, ...sizes.map((s) => s.width)), [sizes]);
  const fitScale = width > 0 ? (width - 32) / maxPageWidth : 1;
  const scale = Math.max(0.1, fitScale * zoom);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const probe = el.scrollTop + el.clientHeight * 0.35;
    let page = 1;
    pageRefs.current.forEach((node, i) => {
      if (node && node.offsetTop <= probe) page = i + 1;
    });
    setCurrent(page);
    setPageInput(String(page));
  }, []);

  const goTo = useCallback(
    (n: number) => {
      const target = Math.min(Math.max(1, n), sizes.length || 1);
      const node = pageRefs.current[target - 1];
      if (node && scrollRef.current) scrollRef.current.scrollTo({ top: node.offsetTop - 12, behavior: "smooth" });
      setCurrent(target);
      setPageInput(String(target));
    },
    [sizes.length],
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1">
          <Tip label="Previous page">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => goTo(current - 1)} disabled={!doc || current <= 1} aria-label="Previous page">
              <ChevronLeft />
            </Button>
          </Tip>
          <form
            className="flex items-center gap-1 text-sm text-muted-foreground"
            onSubmit={(e) => {
              e.preventDefault();
              goTo(parseInt(pageInput, 10) || 1);
            }}
          >
            <input
              aria-label="Page number"
              title="Type a page number and press Enter"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
              className="h-7 w-10 rounded-md border border-input bg-background text-center text-sm text-foreground"
            />
            <span>/ {sizes.length || "–"}</span>
          </form>
          <Tip label="Next page">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => goTo(current + 1)} disabled={!doc || current >= sizes.length} aria-label="Next page">
              <ChevronRight />
            </Button>
          </Tip>
        </div>
        <div className="flex items-center gap-1">
          <Tip label="Zoom out">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(2)))} aria-label="Zoom out">
              <ZoomOut />
            </Button>
          </Tip>
          <Tip label="Reset zoom to fit the width">
            <button className="w-14 text-center text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setZoom(1)} aria-label="Fit width">
              {Math.round(zoom * 100)}%
            </button>
          </Tip>
          <Tip label="Zoom in">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} aria-label="Zoom in">
              <ZoomIn />
            </Button>
          </Tip>
          {expandable && (
            <Tip label="Open full screen">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpanded(true)} aria-label="Open full screen" disabled={!doc}>
                <Maximize2 />
              </Button>
            </Tip>
          )}
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="relative overflow-auto bg-muted/50" style={{ height }}>
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-destructive">{error}</div>
        ) : !doc ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading preview…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-4" style={{ minWidth: maxPageWidth * scale + 32 }}>
            {sizes.map((s, i) => (
              <div key={i} ref={(el) => (pageRefs.current[i] = el)}>
                <PdfPageCanvas doc={doc} pageNumber={i + 1} scale={scale} size={s} root={scrollRef} />
              </div>
            ))}
          </div>
        )}
      </div>

      {expandable && (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="flex h-[94vh] max-w-6xl flex-col gap-3 p-3 sm:p-4">
            <DialogTitle className="truncate pr-8 text-base">{name || "PDF preview"}</DialogTitle>
            <PdfViewer file={file} height="calc(94vh - 110px)" expandable={false} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface PageCanvasProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  size: PageSize;
  root: React.RefObject<HTMLDivElement>;
}

function PdfPageCanvas({ doc, pageNumber, scale, size, root }: PageCanvasProps) {
  const holder = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root: root.current,
      rootMargin: "600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    const timer = setTimeout(async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: scale * dpr });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const off = document.createElement("canvas");
        off.width = Math.floor(viewport.width);
        off.height = Math.floor(viewport.height);
        task = page.render({ canvasContext: off.getContext("2d")!, viewport });
        await task.promise;
        if (cancelled) return;
        canvas.width = off.width;
        canvas.height = off.height;
        canvas.getContext("2d")!.drawImage(off, 0, 0);
        setRendered(true);
      } catch {
        /* render cancelled or failed — placeholder stays */
      }
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      task?.cancel();
    };
  }, [visible, doc, pageNumber, scale]);

  const w = Math.floor(size.width * scale);
  const h = Math.floor(size.height * scale);
  return (
    <div ref={holder} className="relative bg-white shadow-card" style={{ width: w, height: h }}>
      <canvas ref={canvasRef} style={{ width: w, height: h }} className="block" />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">Page {pageNumber}</div>
      )}
      <span className="pointer-events-none absolute bottom-1 right-2 rounded bg-black/50 px-1.5 text-[10px] font-medium text-white">{pageNumber}</span>
    </div>
  );
}

export default PdfViewer;
