// Waits until the pieces Electron needs in dev mode are actually ready —
// the compiled main + preload bundles on disk and the Vite dev server on
// its port — then launches Electron. Without this, `npm run dev` races:
// Electron starts before tsc/vite have produced anything and shows a blank
// window (or nothing at all).
//
// Deliberately dependency-free: this project is often set up on networks
// that throttle or block large downloads, so every avoidable dependency is
// one less thing that can fail at install time.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_FILES = [
  path.join(projectRoot, "dist/main/main.js"),
  path.join(projectRoot, "dist/preload/preload.js"),
];
const VITE_PORT = Number(process.env.VITE_PORT ?? 5173);
const TIMEOUT_MS = 60_000;
const POLL_MS = 250;

// Vite binds to "localhost", which on macOS often means the IPv6 loopback
// only — a check hard-coded to 127.0.0.1 waits forever while the server is
// happily serving on ::1. So try both and accept whichever answers.
const LOOPBACK_HOSTS = ["127.0.0.1", "::1"];

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.on("connect", () => done(true));
    socket.on("error", () => done(false));
  });
}

async function portIsOpen(port) {
  const results = await Promise.all(LOOPBACK_HOSTS.map((host) => canConnect(host, port)));
  return results.some(Boolean);
}

async function waitForReady() {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const filesReady = REQUIRED_FILES.every((file) => existsSync(file));
    if (filesReady && (await portIsOpen(VITE_PORT))) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return false;
}

const ready = await waitForReady();
if (!ready) {
  console.error(
    `[batuffolina] Electron non avviato: dopo ${TIMEOUT_MS / 1000}s mancano ancora ` +
      `i file compilati o il dev server sulla porta ${VITE_PORT}.`,
  );
  process.exit(1);
}

const electronBin = process.platform === "win32" ? "electron.cmd" : "electron";
const electronPath = path.join(projectRoot, "node_modules/.bin", electronBin);
console.log("[batuffolina] tutto pronto, avvio Electron…");

const child = spawn(electronPath, ["."], { cwd: projectRoot, stdio: "inherit" });

child.on("error", (error) => {
  console.error(`[batuffolina] impossibile avviare Electron (${electronPath}):`, error.message);
  process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 0));
