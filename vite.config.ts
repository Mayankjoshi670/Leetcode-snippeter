import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "src/chrome-extension/manifest.json", dest: "." },
        { src: "src/chrome-extension/public/*", dest: "./public" },
        { src: "src/chrome-extension/popup.html", dest: "." },
        { src: "src/chrome-extension/options.html", dest: "." },
        { src: "src/chrome-extension/content.js", dest: "." },
        { src: "src/chrome-extension/injected.js", dest: "." },
      ],
    }),
  ],
  server: {
    open: "/popup-local.html",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/chrome-extension/popup.js"),
        options: resolve(__dirname, "src/chrome-extension/options.js"),
        background: resolve(__dirname, "src/chrome-extension/background.js"),
        content: resolve(__dirname, "src/chrome-extension/content.js"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
