import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@open-draw/ui/tokens.css";
import "@open-draw/ui/base.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
