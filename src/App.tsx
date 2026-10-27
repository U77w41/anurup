import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { WorkspaceProvider } from "@/lib/workspace";
import PwaPrompt from "@/components/PwaPrompt";
import { ThemeColorSync } from "@/components/ThemeToggle";
import type { ToolId } from "@/lib/tools";

// Each tool is its own chunk so the home page loads fast on slow connections.
const pages: Record<ToolId, React.LazyExoticComponent<() => JSX.Element>> = {
  "passport-photo": lazy(() => import("./pages/tools/PassportPhoto")),
  "size-targeter": lazy(() => import("./pages/tools/SizeTargeter")),
  "image-compressor": lazy(() => import("./pages/tools/ImageCompressor")),
  "crop-rotate": lazy(() => import("./pages/tools/CropRotate")),
  "background-removal": lazy(() => import("./pages/tools/BackgroundRemoval")),
  "signature-cleaner": lazy(() => import("./pages/tools/SignatureCleaner")),
  "format-converter": lazy(() => import("./pages/tools/FormatConverter")),
  "pdf-viewer": lazy(() => import("./pages/tools/PdfViewerTool")),
  "image-to-pdf": lazy(() => import("./pages/tools/ImageToPdf")),
  "pdf-merger": lazy(() => import("./pages/tools/PdfMerger")),
  "pdf-splitter": lazy(() => import("./pages/tools/PdfSplitter")),
  "pdf-page-manager": lazy(() => import("./pages/tools/PdfPageManager")),
  "pdf-compressor": lazy(() => import("./pages/tools/PdfCompressor")),
  "pdf-to-images": lazy(() => import("./pages/tools/PdfToImages")),
  "pdf-stamp": lazy(() => import("./pages/tools/PdfStamp")),
  "pdf-sign": lazy(() => import("./pages/tools/PdfSign")),
  "pdf-unlock": lazy(() => import("./pages/tools/PdfUnlock")),
};

const Fallback = () => (
  <div className="flex min-h-screen items-center justify-center text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="anurup-theme" disableTransitionOnChange>
    <TooltipProvider delayDuration={300}>
      <Toaster />
      <Sonner position="top-center" richColors closeButton />
      <PwaPrompt />
      <ThemeColorSync />
      <WorkspaceProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              {(Object.keys(pages) as ToolId[]).map((id) => {
                const Page = pages[id];
                return <Route key={id} path={`/${id}`} element={<Page />} />;
              })}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </WorkspaceProvider>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
