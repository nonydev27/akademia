// vite.config.js
//
// TODO once you get to Tauri packaging (Phase 9):
// - Tauri expects a fixed dev server port and a `clearScreen: false` setting;
//   revisit this file then and follow the official Tauri + Vite guide.
// - For now this is a plain Vite + React setup.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ["**/src-tauri/**"]
    },
}});
