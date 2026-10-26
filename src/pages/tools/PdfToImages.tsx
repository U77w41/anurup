import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import PageSelectGrid from "@/components/pdf/PageSelectGrid";
import { usePdfDoc } from "@/components/pdf/PdfThumbnail";
import { ErrorNote, Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { canvasToBlob } from "@/lib/image";
import { setJpegDpi } from "@/lib/jpeg";
import { renderPageToCanvas } from "@/lib/pdf";
import { baseName } from "@/lib/format";
import { toast } from "sonner";

const PdfToImages = () => {
  const [file, setFile] = useState<File | null>(null);
  const { doc, numPages, error } = usePdfDoc(file);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dpi, setDpi] = useState(150);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setResults([]);
  }, []);
  useIncomingFiles(handleFiles);

  useEffect(() => setSelected(new Set(Array.from({ length: numPages }, (_, i) => i + 1))), [numPages]);
  useEffect(() => setResults([]), [selected, dpi, format, quality]);

  const run = useCallback(async () => {
    if (!doc || !file || !selected.size) return;
    const out: ResultItem[] = [];
    try {
      const pages = [...selected].sort((a, b) => a - b);
      for (const [i, p] of pages.entries()) {
        setBusy(`Rendering page ${p} (${i + 1} of ${pages.length})…`);
        const canvas = await renderPageToCanvas(doc, p, dpi / 72);
        let blob = await canvasToBlob(canvas, format, quality / 100);
        if (format === "image/jpeg") blob = new Blob([setJpegDpi(new Uint8Array(await blob.arrayBuffer()), dpi) as BlobPart], { type: "image/jpeg" });
        out.push({ blob, name: `${baseName(file.name)}-page-${String(p).padStart(2, "0")}.${format === "image/jpeg" ? "jpg" : "png"}`, note: `${canvas.width}×${canvas.height}` });
      }
      setResults(out);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [doc, file, selected, dpi, format, quality]);

  return (
    <Layout title="PDF to Images" description="Export PDF pages as JPG or PNG images at the resolution you need — then send them straight to the photo tools." width="xl">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Upload a PDF"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setResults([]);
        }}
      />
      <ErrorNote>{error}</ErrorNote>

      {file && numPages > 0 && (
        <Panel>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Resolution">
              <Segmented size="sm" value={dpi} onChange={setDpi} options={[72, 150, 200, 300].map((d) => ({ value: d, label: `${d} DPI` }))} />
            </Field>
            <Field label="Format">
              <Segmented size="sm" value={format} onChange={setFormat} options={[{ value: "image/jpeg", label: "JPG" }, { value: "image/png", label: "PNG" }]} />
            </Field>
            {format === "image/jpeg" && (
              <Field label={`Quality ${quality}%`}>
                <Slider className="pt-2" min={30} max={100} value={[quality]} onValueChange={([q]) => setQuality(q)} aria-label="JPEG quality" />
              </Field>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {selected.size} of {numPages} pages selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set(Array.from({ length: numPages }, (_, i) => i + 1)))}>
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                None
              </Button>
            </div>
          </div>
          <PageSelectGrid file={file} doc={doc} numPages={numPages} selected={selected} onChange={setSelected} />

          <Button onClick={run} disabled={!!busy || !selected.size} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ?? `Export ${selected.size} page${selected.size === 1 ? "" : "s"}`}
          </Button>
        </Panel>
      )}

      {results.length > 0 && <ResultPanel toolId="pdf-to-images" items={results} zipName={`${baseName(file?.name ?? "pages")}-images.zip`} />}
    </Layout>
  );
};

export default PdfToImages;
