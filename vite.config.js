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
        main: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app.html'),
        impressum: resolve(import.meta.dirname, 'impressum.html'),
      },
    },
  },
});
