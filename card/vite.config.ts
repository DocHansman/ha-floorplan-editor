import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FloorplanEditorCard',
      fileName: () => 'floorplan-editor-card.js',
      formats: ['iife'],
    },
    rollupOptions: {
      // Bundle everything — HA loads the card as a standalone resource
      external: [],
    },
    outDir: 'dist',
    emptyOutDir: true,
    // Suppress the chunk-size warning; we know the bundle is large
    chunkSizeWarningLimit: 600,
  },
});
