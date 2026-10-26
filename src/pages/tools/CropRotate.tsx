import { useCallback, useEffect, useRef, useState } from "react";
import { FlipHorizontal2, FlipVertical2, Loader2, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { canvasToBlob, createCanvas, flatten, get2d, loadImage } from "@/lib/image";
import { deriveName, extForMime } from "@/lib/format";
import { toast } from "sonner";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Handle = "nw" | "ne" | "sw" | "se";
type Drag = { mode: "new" | "resize"; ax: number; ay: number } | { mode: "move"; ox: number; oy: number };

const ASPECTS: { value: string; label: string; ratio: number | null }[] = [
  { value: "free", label: "Free", ratio: null },
  { value: "1:1", label: "1:1", ratio: 1 },
  { value: "7:9", label: "35×45 mm", ratio: 35 / 45 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "2:3", label: "2:3", ratio: 2 / 3 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
  { value: "custom", label: "Custom", ratio: null },
];

/** Draw `img` rotated (multiples of 90°) and/or mirrored onto a new canvas. */
function transformed(img: HTMLImageElement, rotation: number, flipH: boolean, flipV: boolean, maxSide = Infinity): HTMLCanvasElement {
  const sideways = rotation % 180 !== 0;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const iw = img.naturalWidth * scale;
  const ih = img.naturalHeight * scale;
  const canvas = createCanvas(sideways ? ih : iw, sideways ? iw : ih);
  const ctx = get2d(canvas);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
  return canvas;
}

function centeredRect(W: number, H: number, ratio: number | null): Rect {
  if (!ratio) return { x: 0, y: 0, w: W, h: H };
  let w = W;
  let h = W / ratio;
  if (h > H) {
    h = H;
    w = H * ratio;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

const CropRotate = () => {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState({ W: 0, H: 0 });
  const [crop, setCrop] = useState<Rect | null>(null);
  const [aspectKey, setAspectKey] = useState("free");
  const [custom, setCustom] = useState({ w: "4", h: "5" });
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<Drag | null>(null);

  const ratio = aspectKey === "custom" ? (parseFloat(custom.w) > 0 && parseFloat(custom.h) > 0 ? parseFloat(custom.w) / parseFloat(custom.h) : null) : ASPECTS.find((a) => a.value === aspectKey)?.ratio ?? null;

  const handleFiles = useCallback(async (files: File[]) => {
    try {
      const loaded = await loadImage(files[0]);
      setFile(files[0]);
      setImg(loaded.img);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setCrop(null);
      setResult(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);
  useIncomingFiles(handleFiles);

  // Rebuild the (downscaled) preview whenever the orientation changes.
  useEffect(() => {
    if (!img) {
      setPreview(null);
      return;
    }
    const sideways = rotation % 180 !== 0;
    const W = sideways ? img.naturalHeight : img.naturalWidth;
    const H = sideways ? img.naturalWidth : img.naturalHeight;
    setDims({ W, H });
    setPreview(transformed(img, rotation, flipH, flipV, 1600).toDataURL("image/jpeg", 0.9));
    setCrop((c) => (c ? centeredRect(W, H, ratio) : c));
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, rotation, flipH, flipV]);

  // Snap the crop box to a new aspect ratio.
  useEffect(() => {
    if (!dims.W) return;
    if (ratio) setCrop(centeredRect(dims.W, dims.H, ratio));
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectKey, custom.w, custom.h]);

  const toImage = (e: React.PointerEvent) => {
    const r = imgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(dims.W, Math.max(0, ((e.clientX - r.left) / r.width) * dims.W)),
      y: Math.min(dims.H, Math.max(0, ((e.clientY - r.top) / r.height) * dims.H)),
    };
  };

  const sizeFrom = (ax: number, ay: number, px: number, py: number): Rect => {
    let w = Math.abs(px - ax);
    let h = Math.abs(py - ay);
    if (ratio) {
      if (w / Math.max(h, 1e-6) > ratio) w = h * ratio;
      else h = w / ratio;
    }
    const maxW = px < ax ? ax : dims.W - ax;
    const maxH = py < ay ? ay : dims.H - ay;
    if (ratio) {
      const s = Math.min(1, maxW / Math.max(w, 1e-6), maxH / Math.max(h, 1e-6));
      w *= s;
      h *= s;
    } else {
      w = Math.min(w, maxW);
      h = Math.min(h, maxH);
    }
    return { x: px < ax ? ax - w : ax, y: py < ay ? ay - h : ay, w, h };
  };

  const onPointerDown = (e: React.PointerEvent, target: "area" | "box" | Handle) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toImage(e);
    setResult(null);
    if (target === "area" || !crop) {
      drag.current = { mode: "new", ax: p.x, ay: p.y };
      setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
    } else if (target === "box") {
      drag.current = { mode: "move", ox: p.x - crop.x, oy: p.y - crop.y };
    } else {
      const ax = target.includes("w") ? crop.x + crop.w : crop.x;
      const ay = target.includes("n") ? crop.y + crop.h : crop.y;
      drag.current = { mode: "resize", ax, ay };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toImage(e);
    if (d.mode === "move") {
      setCrop((c) => c && { ...c, x: Math.min(dims.W - c.w, Math.max(0, p.x - d.ox)), y: Math.min(dims.H - c.h, Math.max(0, p.y - d.oy)) });
    } else {
      setCrop(sizeFrom(d.ax, d.ay, p.x, p.y));
    }
  };

  const onPointerUp = () => {
    drag.current = null;
    setCrop((c) => (c && (c.w < 4 || c.h < 4) ? null : c));
  };

  const apply = useCallback(async () => {
    if (!img || !file) return;
    setBusy(true);
    try {
      const full = transformed(img, rotation, flipH, flipV);
      const r = crop ?? { x: 0, y: 0, w: full.width, h: full.height };
      const out = createCanvas(Math.round(r.w), Math.round(r.h));
      get2d(out).drawImage(full, Math.round(r.x), Math.round(r.y), out.width, out.height, 0, 0, out.width, out.height);
      const mime = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
      const blob = await canvasToBlob(mime === "image/jpeg" ? flatten(out) : out, mime, 0.95);
      setResult({ blob, name: deriveName(file.name, "cropped", extForMime(blob.type)) });
    } finally {
      setBusy(false);
    }
  }, [img, file, rotation, flipH, flipV, crop]);

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <Layout title="Crop, Rotate & Flip" description="Drag on the image to crop (or pick a fixed ratio), rotate in 90° steps and mirror. Then pass the result to any other tool." width="lg">
      <FileDropZone
        accept="image/*"
        onFiles={handleFiles}
        sublabel="JPG, PNG or WebP"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setImg(null);
          setResult(null);
        }}
      />

      {img && preview && (
        <Panel>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 270) % 360)} className="gap-1.5">
              <RotateCcw /> Rotate left
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)} className="gap-1.5">
              <RotateCw /> Rotate right
            </Button>
            <Button variant={flipH ? "secondary" : "outline"} size="sm" onClick={() => setFlipH((f) => !f)} className="gap-1.5">
              <FlipHorizontal2 /> Mirror
            </Button>
            <Button variant={flipV ? "secondary" : "outline"} size="sm" onClick={() => setFlipV((f) => !f)} className="gap-1.5">
              <FlipVertical2 /> Flip
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setRotation(0);
                setFlipH(false);
                setFlipV(false);
                setCrop(null);
                setAspectKey("free");
              }}
            >
              <Undo2 /> Reset
            </Button>
          </div>

          <Field label="Crop ratio">
            <Segmented size="sm" value={aspectKey} onChange={setAspectKey} options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))} />
            {aspectKey === "custom" && (
              <div className="mt-2 flex items-center gap-2">
                <Input aria-label="Ratio width" className="h-9 w-20" type="number" min="0.1" step="0.1" value={custom.w} onChange={(e) => setCustom((c) => ({ ...c, w: e.target.value }))} />
                <span className="text-muted-foreground">:</span>
                <Input aria-label="Ratio height" className="h-9 w-20" type="number" min="0.1" step="0.1" value={custom.h} onChange={(e) => setCustom((c) => ({ ...c, h: e.target.value }))} />
              </div>
            )}
          </Field>

          <div className="flex justify-center rounded-xl bg-muted/50 p-3">
            <div className="relative inline-block select-none" style={{ touchAction: "none" }}>
              <img ref={imgRef} src={preview} alt="Image to crop" className="block max-h-[60vh] max-w-full" draggable={false} />
              {/* Dimmed surround, clipped to the image so it doesn't darken the page. */}
              {crop && crop.w > 0 && crop.h > 0 && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="absolute grid grid-cols-3 grid-rows-3"
                    style={{ left: pct(crop.x, dims.W), top: pct(crop.y, dims.H), width: pct(crop.w, dims.W), height: pct(crop.h, dims.H), boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
                  >
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/25" />
                    ))}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 cursor-crosshair" onPointerDown={(e) => onPointerDown(e, "area")} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} data-testid="crop-area">
                {crop && crop.w > 0 && crop.h > 0 && (
                  <div
                    className="absolute cursor-move border-2 border-primary"
                    style={{ left: pct(crop.x, dims.W), top: pct(crop.y, dims.H), width: pct(crop.w, dims.W), height: pct(crop.h, dims.H) }}
                    onPointerDown={(e) => onPointerDown(e, "box")}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  >
                    {(["nw", "ne", "sw", "se"] as Handle[]).map((h) => (
                      <div
                        key={h}
                        onPointerDown={(e) => onPointerDown(e, h)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        className="absolute h-4 w-4 rounded-sm border-2 border-white bg-primary"
                        style={{
                          left: h.includes("w") ? -8 : undefined,
                          right: h.includes("e") ? -8 : undefined,
                          top: h.includes("n") ? -8 : undefined,
                          bottom: h.includes("s") ? -8 : undefined,
                          cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {crop ? `Selection ${Math.round(crop.w)} × ${Math.round(crop.h)} px` : `Whole image ${dims.W} × ${dims.H} px. Drag on the image to select an area.`}
          </p>

          <Button onClick={apply} disabled={busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {crop ? "Crop image" : "Apply rotation / flip"}
          </Button>
        </Panel>
      )}

      {result && <ResultPanel toolId="crop-rotate" items={[result]} />}
    </Layout>
  );
};

export default CropRotate;
