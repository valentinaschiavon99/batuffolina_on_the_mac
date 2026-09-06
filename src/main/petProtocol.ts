import { protocol, net } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { listPets, petsDir } from "./store";
import { PET_SCHEME } from "../shared/petImage";

/**
 * Pet cutouts live in the app's userData directory, but the renderer can't
 * just point an <img> at a file:// path: in dev the page is served from
 * http://localhost:5173, and Chromium refuses file:// subresources from an
 * http origin (in production the page is file:// and it would work — which
 * is exactly the kind of dev/prod asymmetry worth removing).
 *
 * So we serve cutouts over our own scheme instead: batuffolina://pet/<id>.
 * It behaves identically in dev and in a packaged build, and it only ever
 * hands out files we wrote ourselves into the pets directory.
 */
/** Must run BEFORE app 'ready'. */
export function registerPetSchemePrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PET_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ]);
}

/** Must run AFTER app 'ready'. */
export function registerPetProtocolHandler(): void {
  protocol.handle(PET_SCHEME, async (request) => {
    const url = new URL(request.url);
    const id = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    const pet = listPets().find((candidate) => candidate.id === id);
    if (!pet) {
      return new Response("Pet non trovato", { status: 404 });
    }

    // Defence in depth: never serve anything outside the pets directory,
    // whatever ends up stored in a profile.
    const resolved = path.resolve(pet.imagePath);
    const root = path.resolve(petsDir()) + path.sep;
    if (!resolved.startsWith(root)) {
      return new Response("Percorso non consentito", { status: 403 });
    }

    return net.fetch(pathToFileURL(resolved).toString());
  });
}
