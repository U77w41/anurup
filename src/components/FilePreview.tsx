import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PdfViewer from "@/components/pdf/PdfViewer";
import PdfThumbnail from "@/components/pdf/PdfThumbnail";
import { useObjectUrl } from "@/hooks/use-tool-io";
import { formatBytes, kindOf } from "@/lib/format";
import { loadImage } from "@/lib/image";
import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export const CHECKERBOARD = "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%) 50% / 16px 16px";

/** Small square thumbnail for an image or PDF (first page). */
export function FileThumb({ blob, name, className, fit = "cover" }: { blob: Blob; name: string; className?: string; fit?: "cover" | "contain" }) {
  const kind = kindOf(blob.type, name);
  const url = useObjectUrl(kind === "image" ? blob : null);
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted", className)}>
      {kind === "image" && url ? (
        <img src={url} alt="" className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain")} />
      ) : kind === "pdf" ? (
        <PdfThumbnail file={blob} width={80} className="h-full w-full aspect-auto" />
      ) : (
        <FileQuestion className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

/** Pixel dimensions of an image blob (null while loading / for non-images). */
export function useImageSize(blob: Blob | null | undefined) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    setSize(null);
    if (!blob || !blob.type.startsWith("image/")) return;
    let cancelled = false;
    loadImage(blob)
      .then(({ width, height }) => !cancelled && setSize({ width, height }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [blob]);
  return size;
}

/** Inline preview: image on a checkerboard, or a PDF viewer. */
export function InlinePreview({ blob, name, height = "60vh" }: { blob: Blob; name: string; height?: string }) {
  const kind = kindOf(blob.type, name);
  const url = useObjectUrl(kind === "image" ? blob : null);
  if (kind === "pdf") return <PdfViewer file={blob} name={name} height={height} />;
  if (kind === "image" && url)
    return (
      <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border p-4" style={{ background: CHECKERBOARD }}>
        <img src={url} alt={name} className="max-h-[420px] max-w-full rounded-md object-contain shadow-card" />
      </div>
    );
  return null;
}

/** Full-screen preview dialog for any supported file. */
export function PreviewDialog({ blob, name, open, onOpenChange }: { blob: Blob | null; name: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const kind = blob ? kindOf(blob.type, name) : "other";
  const url = useObjectUrl(open && kind === "image" ? blob : null);
  const dims = useImageSize(open && kind === "image" ? blob : null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[94vh] max-w-5xl flex-col gap-3 p-3 sm:p-4">
        <DialogTitle className="truncate pr-8 text-base">
          {name}
          {blob && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatBytes(blob.size)}
              {dims && ` · ${dims.width}×${dims.height}px`}
            </span>
          )}
        </DialogTitle>
        {blob && kind === "pdf" && <PdfViewer file={blob} name={name} height="calc(94vh - 110px)" expandable={false} />}
        {blob && kind === "image" && url && (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg p-2" style={{ background: CHECKERBOARD }}>
            <img src={url} alt={name} className="max-h-[80vh] max-w-full object-contain" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
