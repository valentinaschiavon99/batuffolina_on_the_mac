import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OnboardingApp } from "./OnboardingApp";
import "../shared/theme.css";
import "./onboarding.css";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <OnboardingApp />
  </StrictMode>,
);
