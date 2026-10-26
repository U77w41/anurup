import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel from "@/components/ResultPanel";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { loadPdfDocument } from "@/lib/pdf";

interface Meta {
  title?: string;
  author?: string;
  producer?: string;
  created?: Date;
}

const PdfViewerTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);

  const handleFiles = useCallback((files: File[]) => setFile(files[0]), []);
  useIncomingFiles(handleFiles);

  useEffect(() => {
    setMeta(null);
    if (!file) return;
    loadPdfDocument(file)
      .then((d) => setMeta({ title: d.getTitle(), author: d.getAuthor(), producer: d.getProducer(), created: d.getCreationDate() }))
      .catch(() => setMeta(null));
  }, [file]);

  const facts = meta
    ? [
        meta.title && `Title: ${meta.title}`,
        meta.author && `Author: ${meta.author}`,
        meta.producer && `Made with: ${meta.producer}`,
        meta.created && `Created: ${meta.created.toLocaleDateString()}`,
      ].filter(Boolean)
    : [];

  return (
    <Layout title="PDF Viewer" description="Open a PDF and read it page by page — then send it to any PDF tool in one click." width="xl">
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Open a PDF"
        files={file ? [file] : []}
        onRemoveFile={() => setFile(null)}
      />
      {file && (
        <ResultPanel
          toolId="pdf-viewer"
          title="Preview"
          items={[{ blob: file, name: file.name }]}
          previewHeight="78vh"
          summary={facts.length > 0 && <span className="text-xs text-muted-foreground">{facts.join(" · ")}</span>}
        />
      )}
    </Layout>
  );
};

export default PdfViewerTool;
