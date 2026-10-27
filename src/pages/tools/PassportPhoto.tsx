import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Move } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { createCanvas, encodeCanvas, get2d, loadImage } from "@/lib/image";
import { deriveName, toPixels } from "@/lib/format";
import { toast } from "sonner";

const PRESETS = [
  { id: "35x45", label: "35×45 mm", hint: "India, UK, EU / Schengen, Australia", wmm: 35, hmm: 45 },
  { id: "2x2in", label: "2×2 in", hint: "US passport & visa, India OCI", wmm: 50.8, hmm: 50.8 },
  { id: "33x48", label: "33×48 mm", hint: "China visa", wmm: 33, hmm: 48 },
  { id: "50x70", label: "50×70 mm", hint: "Canada passport", wmm: 50, hmm: 70 },
  { id: "35x35", label: "35×35 mm", hint: "Some ID cards", wmm: 35, hmm: 35 },
  { id: "custom", label: "Custom", hint: "Enter size in mm", wmm: 0, hmm: 0 },
];

const BACKGROUNDS = [
  { value: "#ffffff", label: "White" },
  { value: "#e8f1fb", label: "Light blue" },
  { value: "#eeeeee", label: "Light grey" },
  { value: "custom", label: "Custom" },
];

const SHEETS = [
  { value: "none", label: "No sheet" },
  { value: "4x6", label: "4×6 in photo paper" },
  { value: "a4", label: "A4 page" },
];

const PassportPhoto = () => {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [presetId, setPresetId] = useState("35x45");
  const [customMm, setCustomMm] = useState({ w: "35", h: "45" });
  const [dpi, setDpi] = useState("300");
  const [bg, setBg] = useState("#ffffff");
  const [customBg, setCustomBg] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [guide, setGuide] = useState(true);
  const [sheet, setSheet] = useState("none");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const preset = PRESETS.find((p) => p.id === presetId)!;
  const dpiNum = Math.min(1200, Math.max(72, parseInt(dpi, 10) || 300));
  const wmm = presetId === "custom" ? parseFloat(customMm.w) || 35 : preset.wmm;
  const hmm = presetId === "custom" ? parseFloat(customMm.h) || 45 : preset.hmm;
  const W = Math.max(50, toPixels(wmm, "mm", dpiNum));
  const H = Math.max(50, toPixels(hmm, "mm", dpiNum));
  const fill = bg === "custom" ? customBg : bg;

  const handleFiles = useCallback(async (files: File[]) => {
    try {
      const loaded = await loadImage(files[0]);
      setFile(files[0]);
      setImg(loaded.img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setResults([]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);
  useIncomingFiles(handleFiles);

  /** Geometry of the photo inside a W×H frame, with offsets clamped so the frame stays covered. */
  const layout = useMemo(() => {
    if (!img) return null;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const s = Math.max(W / iw, H / ih) * zoom;
    const dw = iw * s;
    const dh = ih * s;
    const mx = (dw - W) / 2;
    const my = (dh - H) / 2;
    const ox = Math.max(-mx, Math.min(mx, offset.x * W));
    const oy = Math.max(-my, Math.min(my, offset.y * H));
    return { x: (W - dw) / 2 + ox, y: (H - dh) / 2 + oy, dw, dh };
  }, [img, W, H, zoom, offset]);

  const draw = useCallback(
    (canvas: HTMLCanvasElement, withGuide: boolean) => {
      if (!img || !layout) return;
      canvas.width = W;
      canvas.height = H;
      const ctx = get2d(canvas);
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, layout.x, layout.y, layout.dw, layout.dh);
      if (withGuide) {
        // Typical rule: head (chin to crown) ≈ 70–80% of photo height, eyes ~55–60% from bottom.
        ctx.save();
        ctx.strokeStyle = "rgba(249,115,22,0.9)";
        ctx.lineWidth = Math.max(2, W / 200);
        ctx.setLineDash([W / 40, W / 60]);
        ctx.beginPath();
        ctx.ellipse(W / 2, H * 0.45, W * 0.3, H * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(W * 0.15, H * 0.42);
        ctx.lineTo(W * 0.85, H * 0.42);
        ctx.stroke();
        ctx.restore();
      }
    },
    [img, layout, W, H, fill],
  );

  useEffect(() => {
    if (previewRef.current) draw(previewRef.current, guide);
  }, [draw, guide]);

  useEffect(() => setResults([]), [presetId, customMm, dpi, bg, customBg, zoom, offset, sheet]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d || !layout) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = d.ox + (e.clientX - d.x) / rect.width;
    const ny = d.oy + (e.clientY - d.y) / rect.height;
    const mx = (layout.dw - W) / 2 / W;
    const my = (layout.dh - H) / 2 / H;
    setOffset({ x: Math.max(-mx, Math.min(mx, nx)), y: Math.max(-my, Math.min(my, ny)) });
  };

  const generate = useCallback(async () => {
    if (!img || !file) return;
    setBusy(true);
    try {
      const photo = createCanvas(W, H);
      draw(photo, false);
      const { blob } = await encodeCanvas(photo, { mime: "image/jpeg", quality: 0.95, dpi: dpiNum });
      const items: ResultItem[] = [{ blob, name: deriveName(file.name, `passport-${Math.round(wmm)}x${Math.round(hmm)}mm`, "jpg"), note: `${W}×${H}px @ ${dpiNum} DPI` }];

      if (sheet !== "none") {
        const [sw, sh] = sheet === "4x6" ? [toPixels(4, "in", dpiNum), toPixels(6, "in", dpiNum)] : [toPixels(210, "mm", dpiNum), toPixels(297, "mm", dpiNum)];
        const gap = toPixels(2, "mm", dpiNum);
        const margin = toPixels(5, "mm", dpiNum);
        const cols = Math.max(1, Math.floor((sw - 2 * margin + gap) / (W + gap)));
        const rows = Math.max(1, Math.floor((sh - 2 * margin + gap) / (H + gap)));
        const sheetCanvas = createCanvas(sw, sh);
        const ctx = get2d(sheetCanvas);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sw, sh);
        const startX = (sw - (cols * W + (cols - 1) * gap)) / 2;
        const startY = (sh - (rows * H + (rows - 1) * gap)) / 2;
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const x = startX + c * (W + gap);
            const y = startY + r * (H + gap);
            ctx.drawImage(photo, x, y);
            ctx.strokeRect(x - 0.5, y - 0.5, W + 1, H + 1);
          }
        const sheetEnc = await encodeCanvas(sheetCanvas, { mime: "image/jpeg", quality: 0.95, dpi: dpiNum });
        items.push({ blob: sheetEnc.blob, name: deriveName(file.name, `passport-sheet-${sheet}`, "jpg"), note: `${cols * rows} copies, print at 100% scale` });
      }
      setResults(items);
    } finally {
      setBusy(false);
    }
  }, [img, file, W, H, draw, dpiNum, sheet, wmm, hmm]);

  return (
    <Layout title="Passport Photo Maker" description="Pick a size, drag to position the face inside the guide, choose a background, and export at the right DPI — plus an optional printable sheet." width="lg">
      <FileDropZone
        accept="image/*"
        onFiles={handleFiles}
        label="Upload your photo"
        sublabel="A front-facing photo with even light works best"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setImg(null);
          setResults([]);
        }}
      />

      {img && (
        <Panel>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <Field label="Size" hint={presetId !== "custom" ? preset.hint : undefined}>
                <Segmented size="sm" value={presetId} onChange={(v) => { setPresetId(v); setOffset({ x: 0, y: 0 }); }} options={PRESETS.map((p) => ({ value: p.id, label: p.label, title: p.hint }))} />
                {presetId === "custom" && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Input aria-label="Width in mm" className="h-9 w-20" type="number" value={customMm.w} onChange={(e) => setCustomMm((c) => ({ ...c, w: e.target.value }))} />×
                    <Input aria-label="Height in mm" className="h-9 w-20" type="number" value={customMm.h} onChange={(e) => setCustomMm((c) => ({ ...c, h: e.target.value }))} />
                    mm
                  </div>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="DPI" hint={`Output: ${W} × ${H} px`}>
                  <Input type="number" min={72} max={1200} value={dpi} onChange={(e) => setDpi(e.target.value)} />
                </Field>
                <Field label={`Zoom ${zoom.toFixed(2)}×`}>
                  <Slider className="pt-3" min={1} max={3} step={0.01} value={[zoom]} onValueChange={([z]) => setZoom(z)} aria-label="Zoom" />
                </Field>
              </div>

              <Field label="Background fill" hint="Visible where the photo doesn’t cover the frame, or behind transparent PNGs (e.g. from Background Remover).">
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented size="sm" value={bg} onChange={setBg} options={BACKGROUNDS} />
                  {bg === "custom" && <input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" aria-label="Custom colour" title="Custom colour" />}
                </div>
              </Field>

              <Field label="Printable sheet">
                <Segmented size="sm" value={sheet} onChange={setSheet} options={SHEETS} />
              </Field>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={guide} onCheckedChange={setGuide} /> Show face guide (preview only)
              </label>
            </div>

            <div className="flex flex-col items-center gap-2">
              <canvas
                ref={previewRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => (dragRef.current = null)}
                className="max-h-[420px] w-auto max-w-full cursor-grab rounded-lg border border-border shadow-card active:cursor-grabbing"
                style={{ aspectRatio: `${W} / ${H}`, touchAction: "none" }}
                aria-label="Photo position preview"
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Move className="h-3.5 w-3.5" /> Drag to position, zoom to fit the head in the oval
              </p>
            </div>
          </div>

          <Button onClick={generate} disabled={busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />} Generate passport photo
          </Button>
        </Panel>
      )}

      {results.length > 0 && <ResultPanel toolId="passport-photo" items={results} zipName="passport-photos.zip" />}
    </Layout>
  );
};

export default PassportPhoto;
