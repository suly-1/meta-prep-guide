/**
 * Standalone entry point — no tRPC, no auth, no server dependency.
 * All features use localStorage only.
 */
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.standalone";

createRoot(document.getElementById("root")!).render(<App />);
