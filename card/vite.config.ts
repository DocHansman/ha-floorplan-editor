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
    rollupOptions: { external: [] },
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
  },
});
