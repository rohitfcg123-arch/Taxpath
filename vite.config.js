import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  // GitHub Pages serves this repository under /Taxpath/
  base: "/Taxpath/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        signin: resolve(process.cwd(), "signin.html")
      }
    }
  }
});
