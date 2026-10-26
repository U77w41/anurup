import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { openPdf, renderThumbnail, describePdfError, type PDFDocumentProxy } from "@/lib/pdfRender";
import { cn } from "@/lib/utils";

/** Open a PDF once for a component tree (thumbnail grids). Destroyed on change/unmount. */
export function usePdfDoc(file: Blob | null | undefined) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDoc(null);
    setError(null);
    if (!file) return;
    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;
    openPdf(file)
      .then((d) => {
        opened = d;
        if (!cancelled) setDoc(d);
        else void d.destroy();
      })
      .catch((e) => !cancelled && setError(describePdfError(e)));
    return () => {
      cancelled = true;
      if (opened) void opened.destroy();
    };
  }, [file]);
  return { doc, error, numPages: doc?.numPages ?? 0 };
}

interface PdfThumbnailProps {
  file: Blob;
  page?: number;
  width?: number;
  doc?: PDFDocumentProxy | null;
  className?: string;
  /** Extra CSS rotation (degrees) applied to the rendered image. */
  rotate?: number;
}

/** Lazily rendered page thumbnail (renders when scrolled into view). */
const PdfThumbnail = ({ file, page = 1, width = 140, doc, className, rotate = 0 }: PdfThumbnailProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || doc === null) return; // doc === null => parent still loading
    let cancelled = false;
    setFailed(false);
    renderThumbnail(file, page, width, doc ?? undefined)
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [visible, file, page, width, doc]);

  const quarter = ((rotate % 360) + 360) % 360;
  const sideways = quarter === 90 || quarter === 270;

  return (
    <div ref={ref} className={cn("flex aspect-[3/4] items-center justify-center overflow-hidden bg-white", className)}>
      {src ? (
        <img
          src={src}
          alt={`Page ${page}`}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ transform: `rotate(${rotate}deg)${sideways ? " scale(0.75)" : ""}` }}
        />
      ) : failed ? (
        <FileText className="h-6 w-6 text-neutral-400" />
      ) : (
        <div className="h-full w-full animate-pulse bg-neutral-100 dark:bg-neutral-600" />
      )}
    </div>
  );
};

export default PdfThumbnail;
