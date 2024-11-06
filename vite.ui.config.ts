import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020', // Changed from esnext to ensure consistent behavior
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ['@octokit/core'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
});
