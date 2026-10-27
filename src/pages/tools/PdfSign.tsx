import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2, Type } from "lucide-react";
import { StandardFonts, degrees, rgb } from "pdf-lib";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { usePdfDoc } from "@/components/pdf/PdfThumbnail";
import { ErrorNote, Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileThumb } from "@/components/FilePreview";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { canvasToBlob, imageToCanvas, loadImage } from "@/lib/image";
import { loadPdfDocument, pdfDocToBlob, visualSize, visualToPage } from "@/lib/pdf";
import { deriveName, uid } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tip } from "@/components/Tip";

interface Placed {
  id: string;
  page: number;
  kind: "image" | "text";
  /** Box position/size as fractions of the displayed page (origin top-left). */
  x: number;
  y: number;
  w: number;
  h: number;
  // image
  blob?: Blob;
  url?: string;
  aspect?: number;
  // text
  text?: string;
  size?: number; // points
  color?: "black" | "blue";
}

const COLORS = { black: rgb(0.07, 0.07, 0.07), blue: rgb(0.06, 0.18, 0.55) };
const CSS_COLORS = { black: "#111", blue: "#102e8c" };
const BASELINE = 0.85; // baseline offset (em) for a line-height:1 Helvetica/Arial box

function today(fmt: string) {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return fmt === "mdy" ? `${mm}/${dd}/${yyyy}` : fmt === "iso" ? `${yyyy}-${mm}-${dd}` : `${dd}/${mm}/${yyyy}`;
}

const PdfSign = () => {
  const [file, setFile] = useState<File | null>(null);
  const { doc, numPages, error } = usePdfDoc(file);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState({ w: 612, h: 792 });
  const [items, setItems] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [dateFmt, setDateFmt] = useState("dmy");
  const [displayW, setDisplayW] = useState(0);
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: string; mode: "move" | "resize"; sx: number; sy: number; start: Placed } | null>(null);
  const { files: workspace } = useWorkspace();
  const workspaceImages = workspace.filter((f) => f.kind === "image");

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setItems((prev) => {
      prev.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      return [];
    });
    setPage(1);
    setResult(null);
  }, []);
  useIncomingFiles(handleFiles);
  useEffect(() => setResult(null), [items]);

  // Track stage width for crisp rendering and font scaling.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setDisplayW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc]);

  // Render the current page.
  useEffect(() => {
    if (!doc || !displayW) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    (async () => {
      const p = await doc.getPage(page);
      const base = p.getViewport({ scale: 1 });
      if (cancelled) return;
      setPageSize({ w: base.width, h: base.height });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vp = p.getViewport({ scale: (displayW / base.width) * dpr });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const off = document.createElement("canvas");
      off.width = Math.floor(vp.width);
      off.height = Math.floor(vp.height);
      task = p.render({ canvasContext: off.getContext("2d")!, viewport: vp });
      await task.promise.catch(() => undefined);
      if (cancelled) return;
      canvas.width = off.width;
      canvas.height = off.height;
      canvas.getContext("2d")!.drawImage(off, 0, 0);
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, displayW]);

  const addImage = useCallback(
    async (blob: Blob) => {
      try {
        const { width, height } = await loadImage(blob);
        const aspect = width / height;
        const pageAspect = pageSize.w / pageSize.h;
        let w = 0.3;
        let h = (w / aspect) * pageAspect;
        if (h > 0.5) {
          // Tall images (e.g. a passport photo) start smaller.
          w *= 0.5 / h;
          h = 0.5;
        }
        const item: Placed = { id: uid(), page, kind: "image", x: 0.5 - w / 2, y: 0.5 - h / 2, w, h, blob, url: URL.createObjectURL(blob), aspect };
        setItems((prev) => [...prev, item]);
        setSelected(item.id);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [page, pageSize],
  );

  const addText = useCallback(
    (value: string) => {
      if (!value.trim()) return;
      // Stagger new boxes so they don't land on top of each other.
      const n = items.filter((p) => p.page === page && p.kind === "text").length;
      const item: Placed = { id: uid(), page, kind: "text", x: 0.3, y: 0.3 + ((n * 0.05) % 0.5), w: 0.3, h: 0.03, text: value, size: 12, color: "black" };
      setItems((prev) => [...prev, item]);
      setSelected(item.id);
      setText("");
    },
    [page, items],
  );

  const patch = (id: string, p: Partial<Placed>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const removeItem = (id: string) =>
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.url) URL.revokeObjectURL(it.url);
      return prev.filter((x) => x.id !== id);
    });

  const onPointerDown = (e: React.PointerEvent, it: Placed, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelected(it.id);
    drag.current = { id: it.id, mode, sx: e.clientX, sy: e.clientY, start: it };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (!d || !stage) return;
    const r = stage.getBoundingClientRect();
    const dx = (e.clientX - d.sx) / r.width;
    const dy = (e.clientY - d.sy) / r.height;
    const s = d.start;
    if (d.mode === "move") {
      patch(d.id, { x: Math.min(1 - s.w, Math.max(0, s.x + dx)), y: Math.min(1 - s.h, Math.max(0, s.y + dy)) });
    } else if (s.kind === "image" && s.aspect) {
      const w = Math.max(0.03, Math.min(1 - s.x, s.w + dx));
      const h = (w / s.aspect) * (pageSize.w / pageSize.h);
      if (s.y + h <= 1) patch(d.id, { w, h });
    }
  };
  const onPointerUp = () => (drag.current = null);

  const ptToPx = displayW / pageSize.w;
  const sel = items.find((i) => i.id === selected);
  const onPage = items.filter((i) => i.page === page);

  // Keep text boxes sized to their content so dragging/clamping is accurate.
  const measureText = useCallback(
    (el: HTMLDivElement | null, it: Placed) => {
      if (!el || !displayW) return;
      const w = el.offsetWidth / displayW;
      const h = el.offsetHeight / (displayW * (pageSize.h / pageSize.w));
      if (Math.abs(w - it.w) > 0.002 || Math.abs(h - it.h) > 0.002) patch(it.id, { w, h });
    },
    [displayW, pageSize],
  );

  const exportPdf = useCallback(async () => {
    if (!file || !items.length) return;
    setBusy(true);
    try {
      const pdf = await loadPdfDocument(file);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      for (const it of items) {
        const pg = pages[it.page - 1];
        const { width: VW, height: VH } = visualSize(pg);
        if (it.kind === "image" && it.blob) {
          const { img } = await loadImage(it.blob);
          const isPng = it.blob.type === "image/png";
          const enc = await canvasToBlob(imageToCanvas(img), isPng ? "image/png" : "image/jpeg", 0.92);
          const bytes = await enc.arrayBuffer();
          const embedded = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const w = it.w * VW;
          const h = it.h * VH;
          const p = visualToPage(pg, it.x * VW, VH - (it.y * VH + h));
          pg.drawImage(embedded, { x: p.x, y: p.y, width: w, height: h, rotate: degrees(p.rotate) });
        } else if (it.kind === "text" && it.text) {
          const size = it.size ?? 12;
          const lines = it.text.split("\n");
          lines.forEach((line, li) => {
            const p = visualToPage(pg, it.x * VW, VH - it.y * VH - BASELINE * size - li * size * 1.2);
            pg.drawText(line, { x: p.x, y: p.y, size, font, color: COLORS[it.color ?? "black"], rotate: degrees(p.rotate) });
          });
        }
      }
      setResult({ blob: await pdfDocToBlob(pdf), name: deriveName(file.name, "signed", "pdf"), note: `${items.length} item${items.length > 1 ? "s" : ""} added` });
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(/WinAnsi|cannot encode/i.test(msg) ? "Text can only use basic Latin letters, digits and punctuation." : msg);
    } finally {
      setBusy(false);
    }
  }, [file, items]);

  return (
    <Layout title="Sign & Fill PDF" description="Place your signature or photo, and type names, dates or any text directly onto the page. Drag to position, resize with the corner handle." width="xl">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Upload the PDF form"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setItems([]);
          setResult(null);
        }}
      />
      <ErrorNote>{error}</ErrorNote>

      {file && doc && (
        <Panel>
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Controls */}
            <div className="space-y-5">
              <Field label="Signature or image">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => imgInput.current?.click()}>
                    <ImagePlus /> Upload image
                  </Button>
                  {workspaceImages.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          From workspace
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-h-80 w-64 overflow-y-auto">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Images in workspace</DropdownMenuLabel>
                        {workspaceImages.map((w) => (
                          <DropdownMenuItem key={w.id} className="gap-2" onSelect={() => addImage(w.blob)}>
                            <FileThumb blob={w.blob} name={w.name} className="h-8 w-8" />
                            <span className="truncate">{w.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <input
                  ref={imgInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void addImage(f);
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">Tip: clean it first with the Signature Cleaner (transparent PNG).</p>
              </Field>

              <Field label="Text">
                <div className="flex gap-2">
                  <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Name, place, ID…" onKeyDown={(e) => e.key === "Enter" && addText(text)} />
                  <Tip label="Add this text to the page">
                    <Button size="icon" variant="outline" onClick={() => addText(text)} aria-label="Add text" disabled={!text.trim()}>
                      <Type />
                    </Button>
                  </Tip>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addText(today(dateFmt))}>
                    <CalendarDays /> Add today’s date
                  </Button>
                  <select value={dateFmt} onChange={(e) => setDateFmt(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs" aria-label="Date format">
                    <option value="dmy">DD/MM/YYYY</option>
                    <option value="mdy">MM/DD/YYYY</option>
                    <option value="iso">YYYY-MM-DD</option>
                  </select>
                </div>
              </Field>

              {sel && (
                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Selected {sel.kind}</p>
                  {sel.kind === "text" && (
                    <>
                      <Input value={sel.text} onChange={(e) => patch(sel.id, { text: e.target.value })} aria-label="Edit text" />
                      <Field label={`Size ${sel.size}pt`}>
                        <Slider min={6} max={48} value={[sel.size ?? 12]} onValueChange={([v]) => patch(sel.id, { size: v })} aria-label="Font size" />
                      </Field>
                      <Segmented size="sm" value={sel.color ?? "black"} onChange={(c) => patch(sel.id, { color: c })} options={[{ value: "black", label: "Black" }, { value: "blue", label: "Blue" }]} />
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      removeItem(sel.id);
                      setSelected(null);
                    }}
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {items.length} item{items.length === 1 ? "" : "s"} placed{items.length > 0 && ` on page${new Set(items.map((i) => i.page)).size > 1 ? "s" : ""} ${[...new Set(items.map((i) => i.page))].sort((a, b) => a - b).join(", ")}`}
              </p>
              <Button onClick={exportPdf} disabled={busy || !items.length} className="w-full gap-2">
                {busy && <Loader2 className="animate-spin" />} Save signed PDF
              </Button>
            </div>

            {/* Page stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Tip label="Previous page">
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                    <ChevronLeft />
                  </Button>
                </Tip>
                Page {page} of {numPages}
                <Tip label="Next page">
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page >= numPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                    <ChevronRight />
                  </Button>
                </Tip>
              </div>
              <div className="rounded-xl bg-muted/60 p-2 sm:p-4">
                <div
                  ref={stageRef}
                  className="relative mx-auto w-full max-w-[820px] select-none bg-white shadow-card"
                  style={{ aspectRatio: `${pageSize.w} / ${pageSize.h}`, touchAction: "none" }}
                  onPointerDown={() => setSelected(null)}
                  data-testid="sign-stage"
                >
                  <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                  {onPage.map((it) => (
                    <div
                      key={it.id}
                      className={cn("absolute cursor-move", selected === it.id ? "outline outline-2 outline-primary" : "outline-dashed outline-1 outline-primary/40 hover:outline-primary")}
                      style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: it.kind === "image" ? `${it.w * 100}%` : undefined, height: it.kind === "image" ? `${it.h * 100}%` : undefined }}
                      onPointerDown={(e) => onPointerDown(e, it, "move")}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                    >
                      {it.kind === "image" ? (
                        <>
                          <img src={it.url} alt="" className="pointer-events-none h-full w-full" draggable={false} />
                          <div
                            className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-primary"
                            onPointerDown={(e) => onPointerDown(e, it, "resize")}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                          />
                        </>
                      ) : (
                        <div
                          ref={(el) => measureText(el, it)}
                          className="whitespace-pre"
                          style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: (it.size ?? 12) * ptToPx, lineHeight: 1, color: CSS_COLORS[it.color ?? "black"] }}
                        >
                          {it.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {result && <ResultPanel toolId="pdf-sign" items={[result]} />}
    </Layout>
  );
};

export default PdfSign;
