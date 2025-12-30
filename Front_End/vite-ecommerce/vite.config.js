import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // allows access from other devices in LAN
    proxy: {
      "/api": {
        target: "http://10.198.75.102:5000", // backend PC IP
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://10.198.75.102:5000", // backend PC IP
        changeOrigin: true,
      },
    },
  },
});
