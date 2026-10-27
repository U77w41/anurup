import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { StandardFonts, degrees, rgb } from "pdf-lib";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { loadPdfDocument, pdfDocToBlob, visualSize, visualToPage } from "@/lib/pdf";
import { deriveName } from "@/lib/format";
import { toast } from "sonner";

type Pos = "bl" | "bc" | "br" | "tl" | "tc" | "tr";
const FORMATS = [
  { value: "{n}", label: "1" },
  { value: "Page {n}", label: "Page 1" },
  { value: "Page {n} of {total}", label: "Page 1 of 9" },
  { value: "{n} / {total}", label: "1 / 9" },
];

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const PdfStamp = () => {
  const [file, setFile] = useState<File | null>(null);
  const [numbers, setNumbers] = useState(true);
  const [pos, setPos] = useState<Pos>("bc");
  const [format, setFormat] = useState("Page {n} of {total}");
  const [start, setStart] = useState("1");
  const [numSize, setNumSize] = useState(10);
  const [skipFirst, setSkipFirst] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmOpacity, setWmOpacity] = useState(15);
  const [wmSize, setWmSize] = useState(64);
  const [wmDiagonal, setWmDiagonal] = useState(true);
  const [wmColor, setWmColor] = useState("#dc2626");
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setResult(null);
  }, []);
  useIncomingFiles(handleFiles);
  useEffect(() => setResult(null), [numbers, pos, format, start, numSize, skipFirst, watermark, wmText, wmOpacity, wmSize, wmDiagonal, wmColor]);

  const apply = useCallback(async () => {
    if (!file || (!numbers && !watermark)) return;
    setBusy(true);
    try {
      const doc = await loadPdfDocument(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      const first = parseInt(start, 10) || 1;
      const counted = skipFirst ? pages.length - 1 : pages.length;

      pages.forEach((page, idx) => {
        const { width: VW, height: VH } = visualSize(page);

        if (watermark && wmText.trim()) {
          const angle = wmDiagonal ? (Math.atan2(VH, VW) * 180) / Math.PI : 0;
          const rad = (angle * Math.PI) / 180;
          const span = wmDiagonal ? Math.hypot(VW, VH) * 0.8 : VW * 0.85;
          const size = Math.min(wmSize, span / Math.max(1, bold.widthOfTextAtSize(wmText, 1)));
          const tw = bold.widthOfTextAtSize(wmText, size);
          const th = bold.heightAtSize(size, { descender: false });
          // Start of baseline so the text's centre sits on the page centre.
          const vx = VW / 2 - (tw / 2) * Math.cos(rad) + (th / 2) * Math.sin(rad);
          const vy = VH / 2 - (tw / 2) * Math.sin(rad) - (th / 2) * Math.cos(rad);
          const p = visualToPage(page, vx, vy);
          page.drawText(wmText, { x: p.x, y: p.y, size, font: bold, color: hexToRgb(wmColor), opacity: wmOpacity / 100, rotate: degrees(p.rotate + angle) });
        }

        if (numbers && !(skipFirst && idx === 0)) {
          const n = first + idx - (skipFirst ? 1 : 0);
          const text = format.replace("{n}", String(n)).replace("{total}", String(first + counted - 1));
          const tw = font.widthOfTextAtSize(text, numSize);
          const margin = 24;
          const vx = pos[1] === "l" ? margin : pos[1] === "r" ? VW - margin - tw : (VW - tw) / 2;
          const vy = pos[0] === "b" ? margin : VH - margin - numSize;
          const p = visualToPage(page, vx, vy);
          page.drawText(text, { x: p.x, y: p.y, size: numSize, font, color: rgb(0.25, 0.25, 0.25), rotate: degrees(p.rotate) });
        }
      });

      setResult({ blob: await pdfDocToBlob(doc), name: deriveName(file.name, "stamped", "pdf") });
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(/WinAnsi|cannot encode/i.test(msg) ? "Only basic Latin letters, digits and punctuation are supported in stamped text." : msg);
    } finally {
      setBusy(false);
    }
  }, [file, numbers, watermark, wmText, wmDiagonal, wmSize, wmColor, wmOpacity, skipFirst, start, format, numSize, pos]);

  return (
    <Layout title="Page Numbers & Watermark" description="Stamp page numbers and/or a text watermark on every page. Rotated pages are handled automatically." width="lg">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Upload a PDF"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setResult(null);
        }}
      />

      {file && (
        <Panel>
          <label className="flex items-center gap-2 font-medium text-foreground">
            <Switch checked={numbers} onCheckedChange={setNumbers} /> Page numbers
          </label>
          {numbers && (
            <div className="grid gap-5 border-l-2 border-border pl-4 sm:grid-cols-2">
              <Field label="Position">
                <Segmented
                  size="sm"
                  value={pos}
                  onChange={setPos}
                  options={[
                    { value: "tl", label: "Top left" },
                    { value: "tc", label: "Top centre" },
                    { value: "tr", label: "Top right" },
                    { value: "bl", label: "Bottom left" },
                    { value: "bc", label: "Bottom centre" },
                    { value: "br", label: "Bottom right" },
                  ]}
                />
              </Field>
              <Field label="Format">
                <Segmented size="sm" value={format} onChange={setFormat} options={FORMATS} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start at">
                  <Input type="number" min={0} value={start} onChange={(e) => setStart(e.target.value)} />
                </Field>
                <Field label={`Size ${numSize}pt`}>
                  <Slider className="pt-3" min={6} max={24} value={[numSize]} onValueChange={([v]) => setNumSize(v)} aria-label="Number size" />
                </Field>
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-muted-foreground">
                <Switch checked={skipFirst} onCheckedChange={setSkipFirst} /> Don’t number the first page (cover)
              </label>
            </div>
          )}

          <label className="flex items-center gap-2 font-medium text-foreground">
            <Switch checked={watermark} onCheckedChange={setWatermark} /> Text watermark
          </label>
          {watermark && (
            <div className="grid gap-5 border-l-2 border-border pl-4 sm:grid-cols-2">
              <Field label="Text">
                <Input value={wmText} onChange={(e) => setWmText(e.target.value)} maxLength={60} />
              </Field>
              <Field label="Direction & colour">
                <div className="flex items-center gap-2">
                  <Segmented size="sm" value={wmDiagonal ? "d" : "h"} onChange={(v) => setWmDiagonal(v === "d")} options={[{ value: "d", label: "Diagonal" }, { value: "h", label: "Horizontal" }]} />
                  <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" aria-label="Watermark colour" title="Watermark colour" />
                </div>
              </Field>
              <Field label={`Opacity ${wmOpacity}%`}>
                <Slider min={5} max={80} value={[wmOpacity]} onValueChange={([v]) => setWmOpacity(v)} aria-label="Opacity" />
              </Field>
              <Field label={`Max size ${wmSize}pt`} hint="Shrinks automatically to fit the page.">
                <Slider min={16} max={140} value={[wmSize]} onValueChange={([v]) => setWmSize(v)} aria-label="Watermark size" />
              </Field>
            </div>
          )}

          <Button onClick={apply} disabled={busy || (!numbers && !watermark)} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            Apply to all pages
          </Button>
        </Panel>
      )}

      {result && <ResultPanel toolId="pdf-stamp" items={[result]} />}
    </Layout>
  );
};

export default PdfStamp;
