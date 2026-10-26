import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { compressToTarget, imageToCanvas, loadImage, mimeSupported, resizeCanvas } from "@/lib/image";
import { deriveName, extForMime, formatBytes } from "@/lib/format";
import { toast } from "sonner";

type Mode = "target" | "quality";
type Format = "image/jpeg" | "image/webp" | "keep";

const ImageCompressor = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("target");
  const [targetKB, setTargetKB] = useState("100");
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [maxSide, setMaxSide] = useState("");
  const [downscale, setDownscale] = useState(true);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [saving, setSaving] = useState<{ before: number; after: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
    setResults([]);
  }, []);
  useIncomingFiles(addFiles);

  useEffect(() => setResults([]), [mode, targetKB, quality, format, maxSide, downscale]);

  const run = useCallback(async () => {
    if (!files.length) return;
    const out: ResultItem[] = [];
    let before = 0;
    let after = 0;
    try {
      for (const [i, f] of files.entries()) {
        setBusy(`Compressing ${i + 1} of ${files.length}…`);
        // Already small enough and no resize requested → don't re-encode at all.
        if (mode === "target" && !(parseInt(maxSide, 10) > 0) && (format === "keep" || format === f.type) && f.size <= (parseFloat(targetKB) || 100) * 1024) {
          before += f.size;
          after += f.size;
          out.push({ blob: f, name: f.name, note: "already under target — kept original" });
          continue;
        }
        const { img } = await loadImage(f);
        let canvas = imageToCanvas(img);
        const limit = parseInt(maxSide, 10);
        if (limit > 0 && Math.max(canvas.width, canvas.height) > limit) {
          const s = limit / Math.max(canvas.width, canvas.height);
          canvas = resizeCanvas(canvas, Math.round(canvas.width * s), Math.round(canvas.height * s));
        }
        let mime = (format === "keep" ? f.type : format) as "image/jpeg" | "image/webp" | "image/png";
        if (!["image/jpeg", "image/webp", "image/png"].includes(mime)) mime = "image/jpeg";
        if (mime === "image/webp" && !mimeSupported("image/webp")) mime = "image/jpeg";

        const res = await compressToTarget(canvas, {
          mime,
          maxBytes: mode === "target" ? Math.max(1, parseFloat(targetKB) || 100) * 1024 : undefined,
          quality: mode === "quality" ? quality / 100 : undefined,
          allowDownscale: mode === "target" && downscale,
        });
        const resized = res.width !== img.naturalWidth || res.height !== img.naturalHeight;
        // Never hand back a bigger file than the user started with.
        if (res.blob.size >= f.size && res.blob.type === f.type && !resized) {
          before += f.size;
          after += f.size;
          out.push({ blob: f, name: f.name, note: "already optimal — kept original" });
          continue;
        }
        before += f.size;
        after += res.blob.size;
        out.push({
          blob: res.blob,
          name: deriveName(f.name, "compressed", extForMime(res.blob.type)),
          note: `${formatBytes(f.size)} → ${formatBytes(res.blob.size)}${resized ? ` · ${res.width}×${res.height}` : ""}${res.withinLimits ? "" : " · over target"}`,
        });
      }
      setResults(out);
      setSaving({ before, after });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [files, format, maxSide, mode, targetKB, quality, downscale]);

  const pct = saving && saving.before > 0 ? Math.round((1 - saving.after / saving.before) * 100) : 0;

  return (
    <Layout title="Image Compressor" description="Shrink one or many images to a target size in KB, or by a quality level. Dimensions are kept unless you allow downscaling." width="lg">
      <FileDropZone
        accept="image/*"
        multiple
        onFiles={addFiles}
        label="Drop images to compress"
        sublabel="JPG, PNG or WebP — batch supported"
        files={files}
        onRemoveFile={(i) => {
          setFiles((prev) => prev.filter((_, j) => j !== i));
          setResults([]);
        }}
      />

      {files.length > 0 && (
        <Panel>
          <Field label="Compress by">
            <Segmented value={mode} onChange={setMode} options={[{ value: "target", label: "Target size (KB)" }, { value: "quality", label: "Quality level" }]} />
          </Field>

          {mode === "target" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Maximum size per image (KB)">
                <Input type="number" min={1} value={targetKB} onChange={(e) => setTargetKB(e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-muted-foreground">
                <Switch checked={downscale} onCheckedChange={setDownscale} /> Shrink dimensions if quality alone isn’t enough
              </label>
            </div>
          ) : (
            <Field label={`Quality ${quality}%`} hint="70–80% is usually indistinguishable from the original.">
              <Slider min={10} max={100} step={1} value={[quality]} onValueChange={([q]) => setQuality(q)} aria-label="Quality" />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Output format" hint={format === "keep" ? "PNG stays lossless — only resizing reduces its size." : undefined}>
              <Segmented size="sm" value={format} onChange={setFormat} options={[{ value: "image/jpeg", label: "JPG" }, { value: "image/webp", label: "WebP" }, { value: "keep", label: "Same as input" }]} />
            </Field>
            <Field label="Limit longest side (px)" hint="Optional, e.g. 1600">
              <Input type="number" min={16} value={maxSide} onChange={(e) => setMaxSide(e.target.value)} placeholder="no limit" />
            </Field>
          </div>

          <Button onClick={run} disabled={!!busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ?? `Compress ${files.length} image${files.length > 1 ? "s" : ""}`}
          </Button>
        </Panel>
      )}

      {results.length > 0 && (
        <ResultPanel
          toolId="image-compressor"
          items={results}
          zipName="compressed-images.zip"
          summary={
            saving && (
              <span className={pct > 0 ? "font-medium text-success" : "text-muted-foreground"}>
                {formatBytes(saving.before)} → {formatBytes(saving.after)} {pct > 0 ? `(−${pct}%)` : ""}
              </span>
            )
          }
        />
      )}
    </Layout>
  );
};

export default ImageCompressor;
