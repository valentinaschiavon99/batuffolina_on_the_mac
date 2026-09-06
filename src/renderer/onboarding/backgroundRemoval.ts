/**
 * Wraps @imgly/background-removal, which segments the subject out of a
 * photo fully on-device (WASM/ONNX) — no photo of anyone's pet ever leaves
 * the computer. The one caveat: the first call downloads a small model
 * file, so it needs network access once; after that the browser cache
 * makes it work offline. If it fails for any reason (offline on first
 * run, unsupported platform, etc.) callers should fall back to the manual
 * eraser rather than blocking the user.
 */
export async function removePetBackground(file: File): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  return removeBackground(file);
}
