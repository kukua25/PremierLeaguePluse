import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you change your API port later, update target here.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:5050", changeOrigin: true }
    }
  }
});
