import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isDesktopBuild = process.env.BUILD_TARGET === "desktop";

export default defineConfig({
  // Desktop packaging needs relative asset paths, web hosting prefers root-relative paths.
  base: isDesktopBuild ? "./" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  }
});
