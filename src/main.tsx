import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Old links used hash routes (…/anurup/#/pdf-merger). Move them to real URLs.
const { hash } = window.location;
if (hash.startsWith("#/")) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  window.history.replaceState(null, "", `${base}${hash.slice(1)}`);
}

// The prerendered page content inside #root is replaced once the app starts.
createRoot(document.getElementById("root")!).render(<App />);
