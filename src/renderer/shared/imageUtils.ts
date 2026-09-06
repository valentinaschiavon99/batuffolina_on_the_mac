/** Small canvas helpers shared by the onboarding cutout editor. */

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossibile leggere l'immagine selezionata."));
    };
    img.src = url;
  });
}

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return loadImageFromFile(new File([blob], "cutout.png", { type: blob.type || "image/png" }));
}

export function drawImageToCanvas(
  image: HTMLImageElement,
  maxDimension = 1200,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponibile.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Finds the bounding box of non-transparent pixels and returns a new,
 * tightly-cropped canvas. Falls back to the original canvas if everything
 * (or nothing) is transparent, so a bad cutout never produces a 0x0 image.
 */
export function cropCanvasToContent(source: HTMLCanvasElement, padding = 6): HTMLCanvasElement {
  const ctx = source.getContext("2d");
  if (!ctx) return source;
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const alphaThreshold = 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    // Nothing survived (e.g. the whole image got erased) — don't crop.
    return source;
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;
  const cropped = document.createElement("canvas");
  cropped.width = croppedWidth;
  cropped.height = croppedHeight;
  const croppedCtx = cropped.getContext("2d");
  if (!croppedCtx) return source;
  croppedCtx.drawImage(
    source,
    minX,
    minY,
    croppedWidth,
    croppedHeight,
    0,
    0,
    croppedWidth,
    croppedHeight,
  );
  return cropped;
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}
