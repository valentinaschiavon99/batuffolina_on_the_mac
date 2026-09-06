import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SettingsApp } from "./SettingsApp";
import "../shared/theme.css";
import "./settings.css";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <SettingsApp />
  </StrictMode>,
);
