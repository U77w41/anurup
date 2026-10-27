import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { CHECKERBOARD } from "@/components/FilePreview";
import { ErrorNote, Field, Panel } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { canvasToBlob, createCanvas, get2d, loadImage } from "@/lib/image";
import { deriveName } from "@/lib/format";
import { cn } from "@/lib/utils";

const BG_COLORS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Light blue", value: "#D6EAF8" },
  { label: "Red", value: "#E74C3C" },
  { label: "Transparent", value: "transparent" },
];

const BackgroundRemoval = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [custom, setCustom] = useState("#3B82F6");
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [result, setResult] = useState<ResultItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cutoutFor = useRef<File | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setCutout(null);
    setResult(null);
    setError(null);
  }, []);
  useIncomingFiles(handleFiles);

  /** Composite the cut-out on the chosen background (cheap, so it re-runs on colour change). */
  const compose = useCallback(
    async (cut: Blob, color: string, source: File) => {
      const { img } = await loadImage(cut);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = get2d(canvas);
      if (color !== "transparent") {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const mime = color === "transparent" ? "image/png" : "image/jpeg";
      const blob = await canvasToBlob(canvas, mime, 0.95);
      setResult({ blob, name: deriveName(source.name, "nobg", mime === "image/png" ? "png" : "jpg") });
    },
    [],
  );

  useEffect(() => {
    if (cutout && file && cutoutFor.current === file) void compose(cutout, bgColor === "custom" ? custom : bgColor, file);
  }, [bgColor, custom, cutout, file, compose]);

  const process = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setProgress("Loading AI model (first run downloads ~40 MB)…");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          if (total > 0) setProgress(`${key.startsWith("fetch") ? "Downloading model" : "Processing"} ${Math.round((current / total) * 100)}%`);
        },
      });
      cutoutFor.current = file;
      setCutout(blob);
    } catch (e) {
      console.error(e);
      setError("Background removal failed. Check your connection (the model is downloaded on first use) or try another photo.");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const swatch = (c: string) => (c === "transparent" ? CHECKERBOARD : c);

  return (
    <Layout title="Background Remover" description="AI-powered background removal that runs entirely in your browser. Swap in a plain colour or keep it transparent." width="lg">
      <FileDropZone
        accept="image/*"
        onFiles={handleFiles}
        label="Upload your photo"
        sublabel="Works best with portraits and product shots"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setCutout(null);
          setResult(null);
        }}
      />

      {file && (
        <Panel>
          <Field label="Background" hint="You can change this after processing without running the model again.">
            <div className="flex flex-wrap gap-2">
              {[...BG_COLORS, { label: "Custom", value: "custom" }].map((c) => (
                <button
                  key={c.value}
                  onClick={() => setBgColor(c.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    bgColor === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <span className="inline-block h-4 w-4 rounded-full border border-border" style={{ background: swatch(c.value === "custom" ? custom : c.value) }} />
                  {c.label}
                </button>
              ))}
              {bgColor === "custom" && (
                <input type="color" value={custom} onChange={(e) => setCustom(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent" aria-label="Custom background colour" title="Custom background colour" />
              )}
            </div>
          </Field>

          {!cutout && (
            <Button onClick={process} disabled={processing} className="w-full gap-2">
              {processing && <Loader2 className="animate-spin" />}
              {processing ? progress : "Remove background"}
            </Button>
          )}
          <ErrorNote>{error}</ErrorNote>
        </Panel>
      )}

      {result && <ResultPanel toolId="background-removal" items={[result]} />}
    </Layout>
  );
};

export default BackgroundRemoval;
