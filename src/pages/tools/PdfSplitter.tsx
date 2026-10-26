import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import PageSelectGrid from "@/components/pdf/PageSelectGrid";
import { usePdfDoc } from "@/components/pdf/PdfThumbnail";
import { ErrorNote, Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { loadPdfDocument, pdfDocToBlob } from "@/lib/pdf";
import { chunkPages, formatPageRange, parsePageRange } from "@/lib/pageRange";
import { baseName } from "@/lib/format";
import { toast } from "sonner";

type Mode = "extract" | "single" | "every" | "ranges";

const PdfSplitter = () => {
  const [file, setFile] = useState<File | null>(null);
  const { doc, numPages, error } = usePdfDoc(file);
  const [mode, setMode] = useState<Mode>("extract");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeText, setRangeText] = useState("");
  const [every, setEvery] = useState("2");
  const [groups, setGroups] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setResults([]);
    setSelected(new Set());
    setRangeText("");
  }, []);
  useIncomingFiles(handleFiles);

  useEffect(() => {
    if (numPages) {
      setGroups(numPages > 1 ? `1-${Math.ceil(numPages / 2)}; ${Math.ceil(numPages / 2) + 1}-${numPages}` : "1");
    }
  }, [numPages]);
  useEffect(() => setResults([]), [mode, selected, every, groups]);

  const updateSelection = (next: Set<number>) => {
    setSelected(next);
    setRangeText(formatPageRange([...next]));
  };

  const plan = useMemo<number[][]>(() => {
    if (!numPages) return [];
    switch (mode) {
      case "extract":
        return selected.size ? [[...selected].sort((a, b) => a - b)] : [];
      case "single":
        return chunkPages(numPages, 1);
      case "every":
        return chunkPages(numPages, parseInt(every, 10) || 1);
      case "ranges":
        // Groups are separated by ";" — or, if none is used, by ",".
        return groups
          .split(groups.includes(";") ? ";" : ",")
          .map((g) => parsePageRange(g, numPages))
          .filter((g) => g.length);
    }
  }, [mode, selected, every, groups, numPages]);

  const split = useCallback(async () => {
    if (!file || !plan.length) return;
    setBusy(true);
    try {
      const src = await loadPdfDocument(file);
      const out: ResultItem[] = [];
      for (const pages of plan) {
        const doc = await PDFDocument.create();
        const copied = await doc.copyPages(src, pages.map((p) => p - 1));
        copied.forEach((p) => doc.addPage(p));
        const label = formatPageRange(pages).replace(/, /g, "_").replace(/\s/g, "");
        out.push({ blob: await pdfDocToBlob(doc), name: `${baseName(file.name)}-p${label}.pdf`, note: `${pages.length} page${pages.length > 1 ? "s" : ""}` });
      }
      setResults(out);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [file, plan]);

  return (
    <Layout title="PDF Splitter" description="Pick pages by clicking thumbnails or typing ranges, or split the whole document into single pages or equal chunks." width="xl">
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
          <Field label="How to split">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "extract", label: "Extract selected pages" },
                { value: "single", label: "Every page separately" },
                { value: "every", label: "Every N pages" },
                { value: "ranges", label: "Custom ranges" },
              ]}
            />
          </Field>

          {mode === "extract" && (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Pages (e.g. 1-3, 5, 8-)" className="min-w-[220px] flex-1">
                  <Input
                    value={rangeText}
                    onChange={(e) => {
                      setRangeText(e.target.value);
                      setSelected(new Set(parsePageRange(e.target.value, numPages)));
                    }}
                    placeholder="Click pages below or type a range"
                  />
                </Field>
                <Button variant="outline" size="sm" onClick={() => updateSelection(new Set(Array.from({ length: numPages }, (_, i) => i + 1)))}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => updateSelection(new Set())}>
                  Clear
                </Button>
              </div>
              <PageSelectGrid file={file} doc={doc} numPages={numPages} selected={selected} onChange={updateSelection} />
              <p className="text-xs text-muted-foreground">Tip: Shift+click selects a run of pages.</p>
            </>
          )}

          {mode === "every" && (
            <Field label="Pages per file" className="max-w-[200px]">
              <Input type="number" min={1} max={numPages} value={every} onChange={(e) => setEvery(e.target.value)} />
            </Field>
          )}

          {mode === "ranges" && (
            <Field label="Ranges — one output file per group" hint="Separate groups with semicolons, e.g. “1-3; 4-6; 7, 9”.">
              <Input value={groups} onChange={(e) => setGroups(e.target.value)} />
            </Field>
          )}

          <p className="text-sm text-muted-foreground">
            {numPages} pages in document · {plan.length ? `${plan.length} output file${plan.length > 1 ? "s" : ""}` : "nothing selected"}
          </p>

          <Button onClick={split} disabled={busy || !plan.length} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Splitting…" : mode === "extract" ? `Extract ${selected.size} page${selected.size === 1 ? "" : "s"}` : `Create ${plan.length} PDF${plan.length === 1 ? "" : "s"}`}
          </Button>
        </Panel>
      )}

      {results.length > 0 && <ResultPanel toolId="pdf-splitter" items={results} zipName={`${baseName(file?.name ?? "split")}-split.zip`} />}
    </Layout>
  );
};

export default PdfSplitter;
