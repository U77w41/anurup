import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { canvasToBlob, imageToCanvas, loadImage, resizeCanvas } from "@/lib/image";
import { cleanSignature } from "@/lib/signature";
import { deriveName } from "@/lib/format";
import { toast } from "sonner";

const INKS: Record<string, [number, number, number] | null> = {
  black: [17, 17, 17],
  blue: [16, 46, 140],
  original: null,
};

const SignatureCleaner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [auto, setAuto] = useState(true);
  const [threshold, setThreshold] = useState(160);
  const [ink, setInk] = useState("black");
  const [background, setBackground] = useState<"white" | "transparent">("white");
  const [trim, setTrim] = useState(true);
  const [padding, setPadding] = useState(12);
  const [result, setResult] = useState<ResultItem | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    try {
      const { img } = await loadImage(files[0]);
      let c = imageToCanvas(img);
      const longest = Math.max(c.width, c.height);
      if (longest > 2400) c = resizeCanvas(c, Math.round((c.width * 2400) / longest), Math.round((c.height * 2400) / longest));
      setFile(files[0]);
      setSource(c);
      setAuto(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);
  useIncomingFiles(handleFiles);

  // Live processing, debounced while sliders move.
  useEffect(() => {
    if (!source || !file) {
      setResult(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { canvas, threshold: used } = cleanSignature(source, {
        threshold: auto ? null : threshold,
        ink: INKS[ink],
        transparent: background === "transparent",
        trim,
        padding,
      });
      if (auto) setThreshold(used);
      const mime = background === "transparent" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, mime, 0.95);
      if (!cancelled) setResult({ blob, name: deriveName(file.name, "signature", mime === "image/png" ? "png" : "jpg") });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // threshold is an output in auto mode, so it is excluded there to avoid a loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, file, auto, auto ? 0 : threshold, ink, background, trim, padding]);

  return (
    <Layout title="Signature Cleaner" description="Photograph your signature on white paper and get crisp, evenly-coloured ink on a clean white or transparent background — cropped tight and ready for upload." width="lg">
      <FileDropZone
        accept="image/*"
        onFiles={handleFiles}
        label="Upload a photo or scan of your signature"
        sublabel="Sign with a dark pen on plain white paper"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setSource(null);
        }}
      />

      {source && (
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ink colour">
              <Segmented size="sm" value={ink} onChange={setInk} options={[{ value: "black", label: "Black" }, { value: "blue", label: "Blue" }, { value: "original", label: "Original" }]} />
            </Field>
            <Field label="Background">
              <Segmented size="sm" value={background} onChange={setBackground} options={[{ value: "white", label: "White (JPG)" }, { value: "transparent", label: "Transparent (PNG)" }]} />
            </Field>
          </div>

          <Field label={`Ink threshold ${auto ? "(auto)" : threshold}`} hint="Lower removes more grey smudges; raise it if thin strokes disappear.">
            <div className="flex items-center gap-4">
              <Slider
                min={60}
                max={240}
                step={1}
                value={[threshold]}
                onValueChange={([v]) => {
                  setAuto(false);
                  setThreshold(v);
                }}
                aria-label="Ink threshold"
              />
              <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={auto} onCheckedChange={setAuto} /> Auto
              </label>
            </div>
          </Field>

          <div className="grid items-end gap-5 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={trim} onCheckedChange={setTrim} /> Trim empty space around the signature
            </label>
            {trim && (
              <Field label={`Padding ${padding}px`}>
                <Slider min={0} max={80} step={1} value={[padding]} onValueChange={([v]) => setPadding(v)} aria-label="Padding" />
              </Field>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Tip: use “Continue with → Resize to exact size & KB” to meet a portal’s pixel and KB limits.</p>
        </Panel>
      )}

      {result && <ResultPanel toolId="signature-cleaner" items={[result]} />}
    </Layout>
  );
};

export default SignatureCleaner;
