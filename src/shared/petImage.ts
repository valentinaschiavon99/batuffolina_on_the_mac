/**
 * Custom scheme used to serve pet cutouts to the renderer. Shared so the
 * main process (which registers the handler) and the renderer (which puts
 * the URL in an <img src>) can never drift apart.
 */
export const PET_SCHEME = "batuffolina";

export function petImageUrl(petId: string): string {
  return `${PET_SCHEME}://pet/${encodeURIComponent(petId)}`;
}
