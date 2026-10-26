import { useCallback, useSyncExternalStore } from "react";

/**
 * "Install app" support for Chrome, Edge and Android.
 *
 * The browser fires `beforeinstallprompt` once the site is installable. We keep the
 * event so the sidebar can show an "Install app" button that opens the browser's
 * install dialog. Safari and Firefox don't fire it; there the button stays hidden.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Call once, before React renders: the event can fire very early. */
export function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );

  const install = useCallback(async () => {
    const event = deferred;
    if (!event) return;
    // The saved event can only be used once.
    deferred = null;
    emit();
    await event.prompt();
    await event.userChoice;
  }, []);

  return { canInstall, install };
}
