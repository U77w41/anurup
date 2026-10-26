import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { kindOf, uid, type FileKind } from "./format";
import type { ToolId } from "./tools";

/**
 * The workspace is a shared, in-browser file tray. Any tool can drop its output here
 * and any other tool can pick it up — no download / re-upload round trip. Files are
 * kept in IndexedDB so they survive a page refresh, and never leave the device.
 */

export interface WorkFile {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: FileKind;
  blob: Blob;
  /** Tool that produced the file (undefined for user uploads). */
  source?: ToolId;
  createdAt: number;
}

interface WorkspaceApi {
  files: WorkFile[];
  ready: boolean;
  add: (blob: Blob, name: string, source?: ToolId) => WorkFile;
  remove: (id: string) => void;
  clear: () => void;
  get: (id: string) => WorkFile | undefined;
  rename: (id: string, name: string) => void;
}

const MAX_FILES = 60;
const DB_NAME = "anurup";
const STORE = "workspace";

/* ---------------- IndexedDB (best effort; falls back to memory) ---------------- */

interface StoredRecord extends Omit<WorkFile, "blob"> {
  data: ArrayBuffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req ? (req.result as T) : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function persist(file: WorkFile) {
  // ArrayBuffers are stored instead of Blobs for older Safari compatibility.
  const { blob, ...meta } = file;
  const record: StoredRecord = { ...meta, data: await blob.arrayBuffer() };
  await withStore("readwrite", (s) => s.put(record));
}

/* ------------------------------------------------------------------------------- */

const WorkspaceContext = createContext<WorkspaceApi | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<WorkFile[]>([]);
  const [ready, setReady] = useState(false);
  const filesRef = useRef<WorkFile[]>([]);
  filesRef.current = files;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const records = (await withStore<StoredRecord[]>("readonly", (s) => s.getAll())) ?? [];
        if (cancelled) return;
        const loaded = records
          .map<WorkFile>(({ data, ...meta }) => ({ ...meta, blob: new Blob([data], { type: meta.type }) }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setFiles((current) => {
          const known = new Set(current.map((f) => f.id));
          return [...current, ...loaded.filter((f) => !known.has(f.id))];
        });
      } catch {
        /* private mode / storage blocked: workspace still works for this tab */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback((blob: Blob, name: string, source?: ToolId) => {
    const file: WorkFile = {
      id: uid(),
      name,
      type: blob.type || (name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
      size: blob.size,
      kind: kindOf(blob.type, name),
      blob,
      source,
      createdAt: Date.now(),
    };
    const next = [file, ...filesRef.current];
    const dropped = next.slice(MAX_FILES);
    filesRef.current = next.slice(0, MAX_FILES);
    setFiles(filesRef.current);
    persist(file).catch(() => undefined);
    for (const d of dropped) withStore("readwrite", (s) => s.delete(d.id)).catch(() => undefined);
    return file;
  }, []);

  const remove = useCallback((id: string) => {
    filesRef.current = filesRef.current.filter((f) => f.id !== id);
    setFiles(filesRef.current);
    withStore("readwrite", (s) => s.delete(id)).catch(() => undefined);
  }, []);

  const clear = useCallback(() => {
    filesRef.current = [];
    setFiles([]);
    withStore("readwrite", (s) => s.clear()).catch(() => undefined);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    let changed: WorkFile | undefined;
    filesRef.current = filesRef.current.map((f) => (f.id === id ? (changed = { ...f, name }) : f));
    setFiles(filesRef.current);
    if (changed) persist(changed).catch(() => undefined);
  }, []);

  const get = useCallback((id: string) => filesRef.current.find((f) => f.id === id), []);

  const value = useMemo(() => ({ files, ready, add, remove, clear, get, rename }), [files, ready, add, remove, clear, get, rename]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

export function toFile(w: WorkFile): File {
  return new File([w.blob], w.name, { type: w.type, lastModified: w.createdAt });
}
