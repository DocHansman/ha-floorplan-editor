import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Strip type="module" and crossorigin from the built index.html so HA Ingress CSP doesn't block the script
function stripModuleType(): import('vite').Plugin {
  return {
    name: 'strip-module-type',
    transformIndexHtml(html: string) {
      return html
        .replace(/type="module"\s*/g, '')
        .replace(/\s*crossorigin/g, '')
        .replace(/<script src=/g, '<script defer src=');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripModuleType()],
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});
