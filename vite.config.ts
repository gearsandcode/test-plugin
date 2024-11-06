import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'es2017', // More conservative target for Figma
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/code.ts'),
      formats: ['es'],
      fileName: () => 'code.js',
    },
  },
  define: {
    // Ensure environment variables are replaced at build time
    'process.env.VITE_GITHUB_APP_ID': JSON.stringify(
      process.env.VITE_GITHUB_APP_ID
    ),
    'process.env.VITE_GITHUB_INSTALLATION_ID': JSON.stringify(
      process.env.VITE_GITHUB_INSTALLATION_ID
    ),
    'process.env.VITE_GITHUB_PRIVATE_KEY': JSON.stringify(
      process.env.VITE_GITHUB_PRIVATE_KEY
    ),
  },
});
