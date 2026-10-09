import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the build works at a domain root and under any subpath
  // (GitHub Pages project sites, Cloudflare Pages, a folder on any static host).
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Libraries change rarely and content changes often, so they get separate, separately cached files.
        codeSplitting: { groups: [{ name: "vendor", test: /node_modules/ }] },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
