# Contribuire a Batuffolina

Grazie per l'interesse! Alcune linee guida rapide.

## Setup

```bash
npm install
npm run dev
```

Questo avvia in parallelo il dev server di Vite (renderer), `tsc --watch` (processo main) ed
esbuild in watch mode (preload). Elettron va riavviato manualmente dopo modifiche al processo
main (`Ctrl+C` e `npm run dev` di nuovo), mentre il renderer si aggiorna da solo via HMR.

## Prima di aprire una PR

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

La CI su GitHub Actions esegue esattamente questi quattro comandi: se passano in locale,
passeranno anche lì.

## Stile del codice

- TypeScript ovunque, `strict: true`. Evita `any` se non strettamente necessario.
- Prettier per la formattazione (`npm run format`), ESLint per il resto.
- I canali IPC vanno aggiunti in `src/shared/ipcChannels.ts` e i tipi condivisi in
  `src/shared/types.ts` — non usare stringhe "a mano" per i canali IPC.
- Il processo main non deve mai fidarsi ciecamente dell'input del renderer: valida sempre i
  payload che arrivano via IPC.

## Aggiungere una feature al motore del pet

La logica di movimento vive in `src/main/walkEngine.ts` ed è deliberatamente isolata da
Electron (dipende da una piccola interfaccia `EngineWindow`, non da `BrowserWindow`
direttamente) proprio per poterla testare con `vitest` senza aprire finestre vere — vedi
`walkEngine.test.ts` come esempio. Se aggiungi comportamenti nuovi (nuovi stati, reazioni,
interazioni), prova a mantenere questa separazione: rende tutto testabile senza display.

## Smoke test delle pagine renderer

`scripts/smoke-test-renderer.js` apre in sequenza le tre pagine (onboarding, pet, settings) in
finestre nascoste e segnala errori di console o caricamenti falliti — utile su Linux/CI headless
dove non c'è un display reale:

```bash
npm run build
xvfb-run -a npx electron scripts/smoke-test-renderer.js
```

Non sostituisce un test manuale con display reale, ma cattura in fretta errori grossolani
(preload che non carica, moduli mancanti, pagine bianche).

## Segnalare un problema

Apri una issue con: cosa ti aspettavi, cosa è successo invece, sistema operativo e versione di
Batuffolina. Uno screenshot o un GIF aiutano sempre, soprattutto per bug di animazione/rendering.
