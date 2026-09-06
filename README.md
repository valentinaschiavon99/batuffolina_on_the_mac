# 🐾 Batuffolina

**Batuffolina** trasforma la foto del tuo animale in un compagno animato che vive sul desktop —
cammina, si siede, si addormenta e reagisce quando lo coccoli. È la nostra versione, fatta bene,
di [fureverdock.com](https://www.fureverdock.com/): stessa idea (un pet vero che ti tiene
compagnia mentre lavori), ma **open source, gratuita, senza abbonamenti e senza inviare le foto
del tuo animale da nessuna parte** — il ritaglio dello sfondo avviene interamente sul tuo
computer.

Electron + TypeScript + React. MIT license.

## Come funziona

1. Carichi una foto del tuo animale.
2. Il ritaglio dello sfondo avviene **on-device**, via
   [`@imgly/background-removal`](https://github.com/imgly/background-removal-js) (WebAssembly,
   nessun server coinvolto). Se per qualche motivo non è disponibile (ad es. sei offline la
   prima volta, quando serve scaricare il modello), puoi ritagliare il pet a mano con una
   piccola gomma integrata — l'app non ti lascia mai bloccata.
3. Il ritaglio finito viene "portato in vita" da un piccolo motore di movimento procedurale:
   il pet cammina avanti e indietro sul bordo inferiore dello schermo, si ferma, si siede dopo
   un po', si addormenta se lasciato tranquillo a lungo, e puoi trascinarlo con il mouse
   ovunque tu voglia.
4. Vive nella system tray: puoi aggiungere più pet, nasconderli, rimuoverli o regolare
   velocità/dimensione dalle impostazioni.

## Perché "fatto bene"

- **Codice sorgente aperto** (MIT) — puoi leggerlo, modificarlo, compilarlo tu stesso.
- **Le foto non lasciano il tuo computer.** Il ritaglio dello sfondo gira interamente in locale
  via WebAssembly; l'unica richiesta di rete possibile è il download (una tantum, cache poi
  offline) del modello IA usato per il ritaglio.
- **Nessun account, nessun abbonamento, nessuna telemetria.**
- **Degrada con eleganza**: se il ritaglio automatico fallisce, l'app offre subito uno strumento
  manuale invece di bloccarti o mostrare un errore muto.

## Requisiti

- Node.js 20+ e npm
- macOS, Windows o Linux

## Sviluppo

```bash
npm install
npm run dev        # avvia Vite (renderer) + tsc (main) + esbuild (preload) in watch mode
```

Altri comandi utili:

```bash
npm run typecheck  # controllo tipi per main, preload e renderer
npm run lint        # ESLint
npm test            # vitest (unit test del motore di movimento e non solo)
npm run build       # build di produzione (renderer + main + preload)
npm run package      # build + pacchetto installabile per la piattaforma corrente (electron-builder)
npm run package:mac  # .dmg / .zip
npm run package:win  # installer NSIS + versione portable
npm run package:linux # AppImage + .deb
```

## Struttura del progetto

```
src/
  main/        # processo main di Electron: finestre, tray, persistenza, motore di movimento
  preload/     # bridge contextBridge tra main e renderer (bundlato con esbuild)
  renderer/    # tre pagine React indipendenti:
    onboarding/  # carica foto → ritaglio IA/manuale → salva il pet
    pet-stage/   # il pet trasparente che vive sul desktop
    settings/    # impostazioni (velocità, dimensione, suoni, avvio automatico...)
  shared/      # tipi e canali IPC condivisi tra main e renderer
```

## Limitazioni note / idee per il futuro

- Il modello di rimozione sfondo viene scaricato da una CDN pubblica al primo utilizzo: per un
  funzionamento **totalmente** offline fin dal primo avvio si potrebbe auto-ospitare i file del
  modello dentro l'app (vedi la config `publicPath` di `@imgly/background-removal`).
- Il pet cammina solo all'interno del display su cui si trova; non attraversa ancora display
  multipli.
- Non c'è ancora un'icona "vera" dell'app (quella inclusa è un segnaposto generato
  proceduralmente) né gli `.icns`/`.ico` firmati necessari per una distribuzione pubblica senza
  warning del sistema operativo.
- Nessun aggiornamento automatico (auto-update) configurato.

Contributi benvenuti — vedi [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licenza

[MIT](./LICENSE) © Valentina Schiavon
