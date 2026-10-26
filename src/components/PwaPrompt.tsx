import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

const HOUR = 60 * 60 * 1000;

/**
 * Registers the service worker (offline support) and tells the user when a new
 * version has been deployed. The new version only takes over after "Reload",
 * so nobody loses work halfway through a tool.
 */
export default function PwaPrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // An installed app can stay open for days, so check for a new version every hour.
      if (registration) {
        setInterval(() => {
          if (navigator.onLine) void registration.update();
        }, HOUR);
      }
    },
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    },
  });

  useEffect(() => {
    if (offlineReady) toast("ANURUP now works offline.", { id: "pwa-offline", duration: 4000 });
  }, [offlineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    toast("A new version of ANURUP is available.", {
      id: "pwa-update",
      description: "Finish what you are doing, then reload to update.",
      duration: Infinity,
      action: { label: "Reload", onClick: () => void updateServiceWorker(true) },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
