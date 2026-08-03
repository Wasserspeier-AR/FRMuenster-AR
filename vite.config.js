import { defineConfig } from "vite";
import { resolve } from 'path';
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    basicSsl(),
    tailwindcss()
  ],
  server: {
    https: true,
    host: true,
    sourcemap: false
  },
  base: '/FRMuenster-AR/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        legacyApp: resolve(__dirname, 'legacy-app.html'),
        impressum: resolve(__dirname, 'impressum.html'),
      },
    },
  },
});
