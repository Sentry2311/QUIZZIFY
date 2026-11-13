import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:5000';
  const port = Number(env.VITE_PORT || process.env.VITE_PORT) || 5173;

  return {
  plugins: [react()],
  server: {
    port,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/socket.io': { target, changeOrigin: true, ws: true },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/socket.io': { target, changeOrigin: true, ws: true },
    },
  },
  };
});
