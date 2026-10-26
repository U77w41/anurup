import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { Field, Panel, Segmented } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { encodeCanvas, imageToCanvas, loadImage, mimeSupported } from "@/lib/image";
import { deriveName, extForMime } from "@/lib/format";
import { toast } from "sonner";

const FORMATS = [
  { label: "JPG", mime: "image/jpeg" as const },
  { label: "PNG", mime: "image/png" as const },
  { label: "WebP", mime: "image/webp" as const },
];
type Mime = (typeof FORMATS)[number]["mime"];

const FormatConverter = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mime, setMime] = useState<Mime>("image/jpeg");
  const [quality, setQuality] = useState(92);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
    setResults([]);
  }, []);
  useIncomingFiles(addFiles);
  useEffect(() => setResults([]), [mime, quality]);

  const convert = useCallback(async () => {
    if (!files.length) return;
    if (mime === "image/webp" && !mimeSupported("image/webp")) {
      toast.error("This browser can’t encode WebP. Choose JPG or PNG.");
      return;
    }
    setBusy(true);
    try {
      const out: ResultItem[] = [];
      for (const f of files) {
        const { img } = await loadImage(f);
        const { blob } = await encodeCanvas(imageToCanvas(img), { mime, quality: quality / 100 });
        out.push({ blob, name: deriveName(f.name, "", extForMime(blob.type)) });
      }
      setResults(out);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [files, mime, quality]);

  const label = FORMATS.find((f) => f.mime === mime)!.label;

  return (
    <Layout title="Format Converter" description="Convert images between JPG, PNG and WebP. Add as many as you like." width="lg">
      <FileDropZone
        accept="image/*"
        multiple
        onFiles={addFiles}
        sublabel="JPG, PNG, WebP, GIF or BMP"
        files={files}
        onRemoveFile={(i) => {
          setFiles((prev) => prev.filter((_, j) => j !== i));
          setResults([]);
        }}
      />

      {files.length > 0 && (
        <Panel>
          <Field label="Convert to" hint={mime === "image/jpeg" ? "Transparent areas become white." : mime === "image/png" ? "Lossless. Bigger files, but transparency is kept." : undefined}>
            <Segmented value={mime} onChange={setMime} options={FORMATS.map((f) => ({ value: f.mime, label: f.label }))} />
          </Field>
          {mime !== "image/png" && (
            <Field label={`Quality ${quality}%`}>
              <Slider min={10} max={100} step={1} value={[quality]} onValueChange={([q]) => setQuality(q)} aria-label="Quality" />
            </Field>
          )}
          <Button onClick={convert} disabled={busy} className="w-full gap-2">
            {busy && <Loader2 className="animate-spin" />}
            Convert {files.length > 1 ? `${files.length} images` : ""} to {label}
          </Button>
        </Panel>
      )}

      {results.length > 0 && <ResultPanel toolId="format-converter" items={results} zipName="converted-images.zip" />}
    </Layout>
  );
};

export default FormatConverter;
