import { useCallback, useEffect, useState } from "react";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { createCanvas, encodeCanvas, get2d, loadImage, resizeCanvas } from "@/lib/image";
import { deriveName, formatBytes, toPixels } from "@/lib/format";
import { toast } from "sonner";

type Unit = "px" | "cm" | "mm" | "in";
type Fit = "cover" | "contain" | "stretch";

const QUICK = [
  { label: "Photo 200×230 px · 20-50 KB", unit: "px" as Unit, w: "200", h: "230", min: "20", max: "50", dpi: "200" },
  { label: "Photo 3.5×4.5 cm · 200 DPI · ≤ 50 KB", unit: "cm" as Unit, w: "3.5", h: "4.5", min: "", max: "50", dpi: "200" },
  { label: "Signature 140×60 px · 10-20 KB", unit: "px" as Unit, w: "140", h: "60", min: "10", max: "20", dpi: "200" },
  { label: "Document 1000 px wide · ≤ 300 KB", unit: "px" as Unit, w: "1000", h: "", min: "", max: "300", dpi: "150" },
];

const SizeTargeter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [unit, setUnit] = useState<Unit>("px");
  const [width, setWidth] = useState("200");
  const [height, setHeight] = useState("230");
  const [lock, setLock] = useState(false);
  const [dpi, setDpi] = useState("200");
  const [fit, setFit] = useState<Fit>("cover");
  const [minKB, setMinKB] = useState("");
  const [maxKB, setMaxKB] = useState("50");
  const [result, setResult] = useState<ResultItem | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const dpiNum = Math.min(1200, Math.max(1, parseInt(dpi, 10) || 72));
  const aspect = img ? img.naturalWidth / img.naturalHeight : 1;

  const handleFiles = useCallback(async (files: File[]) => {
    try {
      const loaded = await loadImage(files[0]);
      setFile(files[0]);
      setImg(loaded.img);
      setResult(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);
  useIncomingFiles(handleFiles);

  useEffect(() => {
    setResult(null);
    setStatus(null);
  }, [unit, width, height, dpi, fit, minKB, maxKB]);

  const round = (v: number) => (unit === "px" ? String(Math.round(v)) : String(+v.toFixed(2)));
  const onWidth = (v: string) => {
    setWidth(v);
    if (lock && parseFloat(v) > 0) setHeight(round(parseFloat(v) / aspect));
  };
  const onHeight = (v: string) => {
    setHeight(v);
    if (lock && parseFloat(v) > 0) setWidth(round(parseFloat(v) * aspect));
  };

  const process = useCallback(async () => {
    if (!img || !file) return;
    const wv = parseFloat(width);
    const hv = parseFloat(height);
    if (!(wv > 0) && !(hv > 0)) {
      toast.error("Enter a width or a height.");
      return;
    }
    // A blank side is derived from the image's aspect ratio.
    let tw = wv > 0 ? toPixels(wv, unit, dpiNum) : 0;
    let th = hv > 0 ? toPixels(hv, unit, dpiNum) : 0;
    if (!tw) tw = Math.round(th * aspect);
    if (!th) th = Math.round(tw / aspect);
    if (tw > 12000 || th > 12000) {
      toast.error("That is larger than 12000 px. Check the unit and the DPI.");
      return;
    }
    const max = parseFloat(maxKB) > 0 ? parseFloat(maxKB) * 1024 : undefined;
    const min = parseFloat(minKB) > 0 ? parseFloat(minKB) * 1024 : undefined;
    if (max && min && min > max) {
      toast.error("Minimum KB is larger than maximum KB.");
      return;
    }

    setBusy(true);
    try {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const canvas = createCanvas(tw, th);
      const ctx = get2d(canvas);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tw, th);
      if (fit === "stretch") {
        ctx.drawImage(resizeCanvas(img, tw, th), 0, 0);
      } else {
        const s = fit === "cover" ? Math.max(tw / iw, th / ih) : Math.min(tw / iw, th / ih);
        const dw = Math.round(iw * s);
        const dh = Math.round(ih * s);
        ctx.drawImage(resizeCanvas(img, dw, dh), Math.round((tw - dw) / 2), Math.round((th - dh) / 2));
      }

      const enc = await encodeCanvas(canvas, { mime: "image/jpeg", maxBytes: max, minBytes: min, dpi: dpiNum });
      const size = enc.blob.size;
      const okMax = !max || size <= max;
      const okMin = !min || size >= min;
      setStatus({
        ok: okMax && okMin,
        text: okMax && okMin ? `Within limits (${formatBytes(size)})` : !okMax ? `Still ${formatBytes(size)} even at the lowest quality. Reduce the dimensions.` : `Below minimum`,
      });
      setResult({
        blob: enc.blob,
        name: deriveName(file.name, `${tw}x${th}`, "jpg"),
        note: `${dpiNum} DPI${enc.quality != null ? ` · quality ${Math.round(enc.quality * 100)}%` : ""}`,
      });
    } finally {
      setBusy(false);
    }
  }, [img, file, width, height, unit, dpiNum, aspect, maxKB, minKB, fit]);

  return (
    <Layout title="Exact Size & KB Targeter" description="Resize to the exact dimensions a portal asks for — in pixels, cm, mm or inches at a DPI — and land between a minimum and maximum file size." width="lg">
      <FileDropZone
        accept="image/*"
        onFiles={handleFiles}
        label="Upload your image"
        sublabel="Photo, signature or scanned document"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setImg(null);
          setResult(null);
        }}
      />

      {img && (
        <Panel>
          <Field label="Quick presets" hint={`Source: ${img.naturalWidth} × ${img.naturalHeight} px. Always double-check your portal’s exact requirements.`}>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  onClick={() => {
                    setLock(false);
                    setUnit(q.unit);
                    setWidth(q.w);
                    setHeight(q.h);
                    setMinKB(q.min);
                    setMaxKB(q.max);
                    setDpi(q.dpi);
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Unit">
            <Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: "px", label: "Pixels" }, { value: "cm", label: "cm" }, { value: "mm", label: "mm" }, { value: "in", label: "inches" }]} />
          </Field>

          <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-end gap-3">
            <Field label={`Width (${unit})`}>
              <Input type="number" min={0} step="any" value={width} onChange={(e) => onWidth(e.target.value)} placeholder="auto" />
            </Field>
            <Button variant="ghost" size="icon" className="mb-0.5" onClick={() => setLock((l) => !l)} aria-label={lock ? "Unlock aspect ratio" : "Lock aspect ratio"} title={lock ? "Aspect ratio locked" : "Aspect ratio unlocked"}>
              {lock ? <Link2 className="text-primary" /> : <Link2Off />}
            </Button>
            <Field label={`Height (${unit})`}>
              <Input type="number" min={0} step="any" value={height} onChange={(e) => onHeight(e.target.value)} placeholder="auto" />
            </Field>
            <Field label="DPI">
              <Input type="number" min={1} max={1200} value={dpi} onChange={(e) => setDpi(e.target.value)} />
            </Field>
          </div>

          <Field label="When the shape differs from the original" hint="Crop keeps proportions and trims edges; Pad adds white bars; Stretch distorts to fit exactly.">
            <Segmented size="sm" value={fit} onChange={setFit} options={[{ value: "cover", label: "Crop to fill" }, { value: "contain", label: "Pad (white)" }, { value: "stretch", label: "Stretch" }]} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Min size (KB)" hint="Optional. Met by lossless padding.">
              <Input type="number" min={0} value={minKB} onChange={(e) => setMinKB(e.target.value)} placeholder="none" />
            </Field>
            <Field label="Max size (KB)" hint="Best quality that fits is chosen.">
              <Input type="number" min={1} value={maxKB} onChange={(e) => setMaxKB(e.target.value)} placeholder="none" />
            </Field>
          </div>

          <Button onClick={process} disabled={busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Optimizing…" : "Resize & compress"}
          </Button>
        </Panel>
      )}

      {result && (
        <ResultPanel
          toolId="size-targeter"
          items={[result]}
          summary={status && <span className={status.ok ? "font-medium text-success" : "font-medium text-destructive"}>{status.ok ? "✓ " : "✗ "}{status.text}</span>}
        />
      )}
    </Layout>
  );
};

export default SizeTargeter;
