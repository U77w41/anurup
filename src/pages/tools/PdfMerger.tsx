import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Panel } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { loadPdfDocument, pdfDocToBlob } from "@/lib/pdf";
import { toast } from "sonner";

const PdfMerger = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ResultItem | null>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
    setResult(null);
  }, []);
  useIncomingFiles(addFiles);

  const move = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setResult(null);
  };

  const merge = useCallback(async () => {
    if (files.length < 2) return;
    setBusy(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        let src: PDFDocument;
        try {
          src = await loadPdfDocument(file);
        } catch (e) {
          throw new Error(`${file.name}: ${(e as Error).message}`);
        }
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      merged.setCreator("ANURUP");
      setResult({ blob: await pdfDocToBlob(merged), name: "merged.pdf", note: `${merged.getPageCount()} pages from ${files.length} files` });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [files]);

  return (
    <Layout title="PDF Merger" description="Combine several PDFs into one. Preview each file and set the order before merging." width="lg">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple
        onFiles={addFiles}
        label="Drop PDFs here"
        sublabel="Add two or more — they’ll be merged top to bottom"
        files={files}
        onMoveFile={move}
        onReplaceFile={(i, f) => {
          setFiles((prev) => prev.map((x, j) => (j === i ? f : x)));
          setResult(null);
        }}
        onRemoveFile={(i) => {
          setFiles((prev) => prev.filter((_, j) => j !== i));
          setResult(null);
        }}
      />

      {files.length > 0 && (
        <Panel>
          {files.length === 1 ? (
            <p className="text-center text-sm text-muted-foreground">Add at least one more PDF to merge.</p>
          ) : (
            <Button onClick={merge} disabled={busy} className="w-full gap-2">
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Merging…" : `Merge ${files.length} PDFs`}
            </Button>
          )}
        </Panel>
      )}

      {result && <ResultPanel toolId="pdf-merger" items={[result]} />}
    </Layout>
  );
};

export default PdfMerger;
