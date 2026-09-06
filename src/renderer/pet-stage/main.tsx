import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PetStageApp } from "./PetStageApp";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <PetStageApp />
  </StrictMode>,
);
