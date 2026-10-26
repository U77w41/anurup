import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { compressLossless, compressRaster, compressToSize } from "@/lib/pdfCompress";
import { describePdfError, getPageCount } from "@/lib/pdf";
import { deriveName, formatBytes } from "@/lib/format";
import { toast } from "sonner";

type Mode = "lossless" | "balanced" | "strong" | "target";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "lossless", label: "Lossless", hint: "Rewrites the file structure. Text stays selectable; savings are usually small." },
  { value: "balanced", label: "Balanced", hint: "Pages become 150 DPI images at good quality — readable and much smaller." },
  { value: "strong", label: "Strong", hint: "100 DPI, lower quality. Smallest files; fine print may blur." },
  { value: "target", label: "Target size", hint: "Finds the sharpest result under your KB limit." },
];

const PdfCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [mode, setMode] = useState<Mode>("balanced");
  const [targetKB, setTargetKB] = useState("500");
  const [grayscale, setGrayscale] = useState(false);
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    try {
      setPages(await getPageCount(files[0]));
    } catch (e) {
      setPages(0);
      toast.error(describePdfError(e));
    }
  }, []);
  useIncomingFiles(handleFiles);
  useEffect(() => setResult(null), [mode, targetKB, grayscale]);

  const compress = useCallback(async () => {
    if (!file) return;
    setBusy("Starting…");
    try {
      let blob: Blob;
      let note = "";
      if (mode === "lossless") {
        blob = await compressLossless(file);
      } else if (mode === "target") {
        const max = Math.max(10, parseFloat(targetKB) || 500) * 1024;
        if (file.size <= max) {
          const lossless = await compressLossless(file);
          blob = lossless.size < file.size ? lossless : file;
          note = "already under target — kept as vector";
        } else {
          const r = await compressToSize(file, max, grayscale, setBusy);
          blob = r.blob;
          note = `${r.dpi} DPI · quality ${Math.round(r.quality * 100)}%`;
          if (!r.reached) toast.warning(`Couldn’t reach ${targetKB} KB — this is the smallest readable version. Try grayscale or removing pages.`);
        }
      } else {
        const opts = mode === "balanced" ? { dpi: 150, quality: 0.72 } : { dpi: 100, quality: 0.55 };
        blob = await compressRaster(file, { ...opts, grayscale }, setBusy);
        note = `${opts.dpi} DPI`;
      }
      if (blob.size >= file.size && mode !== "target") {
        toast.info("The compressed version wasn’t smaller, so the original is kept.");
        blob = file;
        note = "original kept";
      }
      setResult({ blob, name: deriveName(file.name, "compressed", "pdf"), note });
    } catch (e) {
      toast.error(describePdfError(e));
    } finally {
      setBusy(null);
    }
  }, [file, mode, targetKB, grayscale]);

  const saved = result && file ? Math.round((1 - result.blob.size / file.size) * 100) : 0;
  const current = MODES.find((m) => m.value === mode)!;

  return (
    <Layout title="PDF Compressor" description="Shrink PDFs for upload limits — lossless clean-up, preset levels, or an exact KB target." width="lg">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Upload a PDF to compress"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setResult(null);
        }}
      />

      {file && (
        <Panel>
          <p className="text-sm text-muted-foreground">
            Original: <span className="font-medium text-foreground">{formatBytes(file.size)}</span>
            {pages > 0 && ` · ${pages} page${pages > 1 ? "s" : ""}`}
          </p>

          <Field label="Compression level" hint={current.hint}>
            <Segmented value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: m.label }))} />
          </Field>

          {mode === "target" && (
            <Field label="Maximum size (KB)" className="max-w-[220px]">
              <Input type="number" min={10} value={targetKB} onChange={(e) => setTargetKB(e.target.value)} />
            </Field>
          )}

          {mode !== "lossless" && (
            <>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={grayscale} onCheckedChange={setGrayscale} /> Convert to grayscale (smaller, good for scanned forms)
              </label>
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Pages are re-rendered as images, so text won’t be selectable or searchable and fillable fields are flattened. Preview the result before uploading.
              </p>
            </>
          )}

          <Button onClick={compress} disabled={!!busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ?? "Compress PDF"}
          </Button>
        </Panel>
      )}

      {result && file && (
        <ResultPanel
          toolId="pdf-compressor"
          items={[result]}
          summary={
            <span className={saved > 0 ? "font-medium text-success" : "text-muted-foreground"}>
              {formatBytes(file.size)} → {formatBytes(result.blob.size)}
              {saved > 0 && ` (−${saved}%)`}
            </span>
          }
        />
      )}
    </Layout>
  );
};

export default PdfCompressor;
