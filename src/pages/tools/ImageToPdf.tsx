import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { canvasToBlob, flatten, imageToCanvas, loadImage, resizeCanvas } from "@/lib/image";
import { pdfDocToBlob } from "@/lib/pdf";
import { baseName } from "@/lib/format";
import { toast } from "sonner";

const PAGE_SIZES: Record<string, [number, number] | null> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
  fit: null,
};
const MARGINS = { none: 0, small: 18, large: 36 };
const QUALITY = {
  high: { dpi: 300, q: 0.92 },
  balanced: { dpi: 150, q: 0.8 },
  small: { dpi: 100, q: 0.65 },
};

const ImageToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [size, setSize] = useState<keyof typeof PAGE_SIZES>("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState<keyof typeof MARGINS>("small");
  const [quality, setQuality] = useState<keyof typeof QUALITY>("balanced");
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
    setResult(null);
  }, []);
  useIncomingFiles(addFiles);
  useEffect(() => setResult(null), [size, orientation, margin, quality]);

  const move = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setResult(null);
  };

  const convert = useCallback(async () => {
    if (!files.length) return;
    try {
      const pdf = await PDFDocument.create();
      const { dpi, q } = QUALITY[quality];
      const m = MARGINS[margin];
      for (const [i, file] of files.entries()) {
        setBusy(`Adding image ${i + 1} of ${files.length}…`);
        const { img, width: iw, height: ih } = await loadImage(file);

        // Page geometry (points).
        let pw: number;
        let ph: number;
        const base = PAGE_SIZES[size];
        if (!base) {
          pw = iw * 0.75 + 2 * m; // 96 px per inch → 72 pt per inch
          ph = ih * 0.75 + 2 * m;
        } else {
          const landscape = orientation === "landscape" || (orientation === "auto" && iw > ih);
          [pw, ph] = landscape ? [base[1], base[0]] : base;
        }
        const boxW = pw - 2 * m;
        const boxH = ph - 2 * m;
        const s = Math.min(boxW / iw, boxH / ih, base ? Infinity : 0.75);
        const dw = iw * s;
        const dh = ih * s;

        // Downsample to the chosen print DPI so the PDF stays small.
        const targetW = Math.min(iw, Math.round((dw / 72) * dpi));
        const targetH = Math.min(ih, Math.round((dh / 72) * dpi));
        let canvas = imageToCanvas(img);
        if (targetW < iw) canvas = resizeCanvas(canvas, targetW, targetH);
        const jpg = await canvasToBlob(flatten(canvas), "image/jpeg", q);
        const embedded = await pdf.embedJpg(await jpg.arrayBuffer());

        const page = pdf.addPage([pw, ph]);
        page.drawImage(embedded, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }
      pdf.setTitle(baseName(files[0].name));
      pdf.setCreator("ANURUP");
      const blob = await pdfDocToBlob(pdf);
      setResult({ blob, name: files.length === 1 ? `${baseName(files[0].name)}.pdf` : "images.pdf" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [files, size, orientation, margin, quality]);

  return (
    <Layout title="Image to PDF" description="Turn photos and scans into a single PDF. Re-order pages, choose a paper size, and control the output size." width="lg">
      <FileDropZone
        accept="image/*"
        multiple
        onFiles={addFiles}
        label="Drop images here"
        sublabel="Each image becomes one page, in this order"
        files={files}
        onMoveFile={move}
        onRemoveFile={(i) => {
          setFiles((prev) => prev.filter((_, j) => j !== i));
          setResult(null);
        }}
      />

      {files.length > 0 && (
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Page size">
              <Segmented size="sm" value={size} onChange={setSize} options={[{ value: "a4", label: "A4" }, { value: "letter", label: "Letter" }, { value: "legal", label: "Legal" }, { value: "fit", label: "Fit to image" }]} />
            </Field>
            {size !== "fit" && (
              <Field label="Orientation">
                <Segmented size="sm" value={orientation} onChange={setOrientation} options={[{ value: "auto", label: "Auto" }, { value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]} />
              </Field>
            )}
            <Field label="Margin">
              <Segmented size="sm" value={margin} onChange={setMargin} options={[{ value: "none", label: "None" }, { value: "small", label: "Small" }, { value: "large", label: "Large" }]} />
            </Field>
            <Field label="Image quality" hint={quality === "small" ? "Best for strict upload limits." : quality === "high" ? "Largest file, sharpest print." : "Good for most uploads."}>
              <Segmented size="sm" value={quality} onChange={setQuality} options={[{ value: "high", label: "High" }, { value: "balanced", label: "Balanced" }, { value: "small", label: "Small file" }]} />
            </Field>
          </div>
          <Button onClick={convert} disabled={!!busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ?? `Create PDF (${files.length} page${files.length > 1 ? "s" : ""})`}
          </Button>
        </Panel>
      )}

      {result && <ResultPanel toolId="image-to-pdf" items={[result]} />}
    </Layout>
  );
};

export default ImageToPdf;
