import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../src"),
    },
  },
  optimizeDeps: {
    include: ["@/index"],
  },
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "",
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "[name].[hash].js",
        chunkFileNames: "[name].[hash].js",
        assetFileNames: "[name].[hash].[ext]",
      },
    },
  },
  assetsInclude: ["**/*.svg"],
});
