import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Three independent HTML entry points, one per window type. Electron loads
// each file:// URL directly in production, hence base: "./" so every asset
// reference stays relative instead of rooted at "/".
export default defineConfig({
  root: path.resolve(__dirname, "src/renderer"),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        onboarding: path.resolve(__dirname, "src/renderer/onboarding.html"),
        pet: path.resolve(__dirname, "src/renderer/pet.html"),
        settings: path.resolve(__dirname, "src/renderer/settings.html"),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
