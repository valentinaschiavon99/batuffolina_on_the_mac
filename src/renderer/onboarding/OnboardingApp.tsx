import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { CutoutEditor, type CutoutEditorHandle } from "./CutoutEditor";
import { removePetBackground } from "./backgroundRemoval";
import {
  canvasToPngDataUrl,
  cropCanvasToContent,
  drawImageToCanvas,
  loadImageFromBlob,
  loadImageFromFile,
} from "../shared/imageUtils";

type Step = "pick" | "processing" | "edit" | "saving";

export function OnboardingApp(): JSX.Element {
  const [step, setStep] = useState<Step>("pick");
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [name, setName] = useState("Batuffolina");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const editorRef = useRef<CutoutEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function processFile(file: File): Promise<void> {
    if (!file.type.startsWith("image/")) {
      setError("Scegli un file immagine (JPG, PNG...).");
      return;
    }
    setError(null);
    setStep("processing");
    setAiNotice(null);

    try {
      const blob = await removePetBackground(file);
      const cutoutImage = await loadImageFromBlob(blob);
      const canvas = cropCanvasToContent(drawImageToCanvas(cutoutImage));
      setSourceCanvas(canvas);
      setStep("edit");
    } catch (cause) {
      console.error("[batuffolina] background removal failed, falling back to manual cutout", cause);
      try {
        const original = await loadImageFromFile(file);
        setSourceCanvas(drawImageToCanvas(original));
        setAiNotice(
          "Non sono riuscita a ritagliare automaticamente lo sfondo (serve una connessione a " +
            "internet la prima volta). Usa la gomma qui sotto per ritagliare il tuo pet a mano.",
        );
        setStep("edit");
      } catch (loadError) {
        console.error(loadError);
        setError("Non sono riuscita ad aprire questa immagine. Riprova con un'altra foto.");
        setStep("pick");
      }
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  async function handleSave(): Promise<void> {
    if (!editorRef.current) return;
    setStep("saving");
    setError(null);
    try {
      const finalCanvas = editorRef.current.getResultCanvas();
      const imageDataUrl = canvasToPngDataUrl(finalCanvas);
      await window.batuffolina.pets.create({
        name: name.trim() || "Batuffolina",
        imageDataUrl,
        naturalWidth: finalCanvas.width,
        naturalHeight: finalCanvas.height,
      });
      window.batuffolina.windows.closeCurrent();
    } catch (cause) {
      console.error(cause);
      setError("Qualcosa è andato storto nel salvataggio. Riprova.");
      setStep("edit");
    }
  }

  function handleStartOver(): void {
    setSourceCanvas(null);
    setAiNotice(null);
    setError(null);
    setStep("pick");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <h1>Aggiungi un Batuffolina</h1>
        <p className="subtitle">
          Carica una foto del tuo animale: la ritagliamo dallo sfondo e la trasformiamo in un
          compagno che vive sul tuo desktop.
        </p>
      </header>

      {step === "pick" && (
        <div
          className={`dropzone ${isDragOver ? "drag-over" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="dropzone-icon" aria-hidden>
            🐾
          </span>
          <p>Trascina qui una foto, oppure clicca per sceglierla</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            hidden
          />
        </div>
      )}

      {step === "processing" && (
        <div className="processing">
          <div className="spinner" aria-hidden />
          <p>Sto ritagliando il tuo amico peloso dallo sfondo…</p>
          <p className="processing-hint">
            La prima volta può scaricare un piccolo modello IA: potrebbe volerci un minuto.
          </p>
        </div>
      )}

      {(step === "edit" || step === "saving") && sourceCanvas && (
        <div className="edit-step">
          {aiNotice && <p className="notice">{aiNotice}</p>}
          <CutoutEditor ref={editorRef} sourceCanvas={sourceCanvas} />

          <label className="name-field">
            Nome del pet
            <input
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Luna, Birra, Pallina…"
            />
          </label>

          <div className="edit-actions">
            <button type="button" className="btn-secondary" onClick={handleStartOver}>
              Scegli un'altra foto
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={step === "saving"}
              onClick={handleSave}
            >
              {step === "saving" ? "Salvataggio…" : "Porta sul desktop 🐾"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
