import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toFile, useWorkspace, type WorkFile } from "@/lib/workspace";
import { getTool, toolHref, type ToolId } from "@/lib/tools";

interface IncomingState {
  incoming?: string[];
}

/**
 * Receive files handed over from another tool (via router state) and pass them to
 * `onFiles` exactly once. Clears the router state so a refresh doesn't re-apply them.
 */
export function useIncomingFiles(onFiles: (files: File[]) => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const { get, ready } = useWorkspace();
  const handler = useRef(onFiles);
  handler.current = onFiles;

  useEffect(() => {
    const ids = (location.state as IncomingState | null)?.incoming;
    if (!ids?.length) return;
    const found = ids.map(get).filter(Boolean) as WorkFile[];
    if (!found.length && !ready) return; // wait for IndexedDB to load
    navigate(location.pathname, { replace: true, state: null });
    if (!found.length) {
      toast.error("Those files are no longer in the workspace.");
      return;
    }
    handler.current(found.map(toFile));
    const from = found[0].source ? ` from ${getTool(found[0].source).title}` : "";
    toast.success(found.length === 1 ? `Loaded ${found[0].name}${from}` : `Loaded ${found.length} files${from}`);
  }, [location, get, ready, navigate]);
}

/**
 * Hand files to another tool: they are saved to the workspace (once per Blob) and the
 * target tool opens with them pre-loaded.
 */
export function useSendToTool(source?: ToolId) {
  const { add, get } = useWorkspace();
  const navigate = useNavigate();
  const saved = useRef(new WeakMap<Blob, string>());

  const save = useCallback(
    (blob: Blob, name: string) => {
      const known = saved.current.get(blob);
      if (known && get(known)) return known;
      const file = add(blob, name, source);
      saved.current.set(blob, file.id);
      return file.id;
    },
    [add, get, source],
  );

  const send = useCallback(
    (items: { blob: Blob; name: string }[], target: ToolId) => {
      const ids = items.map((i) => save(i.blob, i.name));
      navigate(toolHref(target), { state: { incoming: ids } satisfies IncomingState });
    },
    [navigate, save],
  );

  const isSaved = useCallback((blob: Blob) => {
    const id = saved.current.get(blob);
    return !!id && !!get(id);
  }, [get]);

  return { send, save, isSaved };
}

/** Navigate to a tool with existing workspace files. */
export function useOpenWorkspaceFiles() {
  const navigate = useNavigate();
  return useCallback(
    (ids: string[], target: ToolId) => navigate(toolHref(target), { state: { incoming: ids } satisfies IncomingState }),
    [navigate],
  );
}

/** Object URL for a Blob that is revoked automatically. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
