// vite.config.ts
import path from "node:path";
import { defineConfig } from "vite";
import generateFile from "vite-plugin-generate-file";
import { viteSingleFile } from "vite-plugin-singlefile";
import figmaManifest from "./manifest";

export default defineConfig(({ mode }) => ({
  mode: "development",
  plugins: [
    viteSingleFile(),
    generateFile({
      type: "json",
      output: "./manifest.json",
      data: figmaManifest,
    }),
  ],
  build: {
    minify: mode === "production",
    sourcemap: mode !== "production",
    emptyOutDir: false,
    outDir: path.resolve("dist"),
    rollupOptions: {
      input: path.resolve("src/code.ts"),
      output: {
        entryFileNames: "code.js",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
