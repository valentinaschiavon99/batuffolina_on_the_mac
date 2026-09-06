// One-off smoke test (not part of the app): loads each built renderer page
// in a headless window and reports any console errors or failed loads.
// Run with: xvfb-run -a electron scripts/smoke-test-renderer.js
const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const pages = ["onboarding.html", "pet.html?petId=fake", "settings.html"];
let hadError = false;

app.whenReady().then(async () => {
  for (const page of pages) {
    const [file, query] = page.split("?");
    await new Promise((resolve) => {
      const win = new BrowserWindow({
        show: false,
        webPreferences: {
          preload: path.join(__dirname, "../dist/preload/preload.js"),
        },
      });
      win.webContents.on("console-message", (_e, level, message) => {
        console.log(`[${file}] console(${level}): ${message}`);
        if (level >= 2) hadError = true;
      });
      win.webContents.on("did-fail-load", (_e, code, desc) => {
        console.log(`[${file}] did-fail-load: ${code} ${desc}`);
        hadError = true;
      });
      win.loadFile(path.join(__dirname, "../dist/renderer", file), {
        query: query ? Object.fromEntries(new URLSearchParams(query)) : undefined,
      });
      setTimeout(() => {
        win.destroy();
        resolve();
      }, 1500);
    });
  }
  console.log(hadError ? "SMOKE TEST: ERRORS FOUND" : "SMOKE TEST: OK");
  app.exit(hadError ? 1 : 0);
});
