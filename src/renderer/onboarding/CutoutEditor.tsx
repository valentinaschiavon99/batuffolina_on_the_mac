import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cropCanvasToContent } from "../shared/imageUtils";

export interface CutoutEditorHandle {
  getResultCanvas: () => HTMLCanvasElement;
}

interface CutoutEditorProps {
  /** The canvas to start editing from — either the AI cutout or, as a fallback, the raw photo. */
  sourceCanvas: HTMLCanvasElement;
}

/**
 * A tiny paint-style editor: erase leftover background with a soft round
 * brush, auto-crop to the remaining content, or start over. This is the
 * safety net for when the automatic cutout misses a paw or an ear — or,
 * when @imgly/background-removal can't run at all, the entire tool.
 */
export const CutoutEditor = forwardRef<CutoutEditorHandle, CutoutEditorProps>(
  ({ sourceCanvas }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const [brushSize, setBrushSize] = useState(28);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = sourceCanvas.width;
      canvas.height = sourceCanvas.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(sourceCanvas, 0, 0);
    }, [sourceCanvas]);

    useImperativeHandle(ref, () => ({
      getResultCanvas: () => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Editor non pronto.");
        return cropCanvasToContent(canvas);
      },
    }));

    function pointerToCanvasCoords(e: ReactPointerEvent<HTMLCanvasElement>): {
      x: number;
      y: number;
    } {
      const canvas = canvasRef.current as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    function eraseAt(x: number, y: number): void {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>): void {
      isDrawingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const { x, y } = pointerToCanvasCoords(e);
      eraseAt(x, y);
    }

    function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>): void {
      if (!isDrawingRef.current) return;
      const { x, y } = pointerToCanvasCoords(e);
      eraseAt(x, y);
    }

    function stopDrawing(): void {
      isDrawingRef.current = false;
    }

    function handleReset(): void {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = sourceCanvas.width;
      canvas.height = sourceCanvas.height;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(sourceCanvas, 0, 0);
    }

    function handleAutoCrop(): void {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cropped = cropCanvasToContent(canvas);
      canvas.width = cropped.width;
      canvas.height = cropped.height;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(cropped, 0, 0);
    }

    return (
      <div className="cutout-editor">
        <div className="cutout-canvas-frame">
          <canvas
            ref={canvasRef}
            className="cutout-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>
        <div className="cutout-tools">
          <label className="brush-label">
            Gomma
            <input
              type="range"
              min={8}
              max={80}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={handleAutoCrop}>
            Ritaglia ai bordi
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Ricomincia da qui
          </button>
        </div>
        <p className="cutout-hint">
          Disegna sopra lo sfondo rimasto per cancellarlo — quello che vedi sullo sfondo a
          scacchi è ciò che resterà trasparente.
        </p>
      </div>
    );
  },
);

CutoutEditor.displayName = "CutoutEditor";
