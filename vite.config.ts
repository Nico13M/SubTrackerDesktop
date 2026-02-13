import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  // Prefer environment variable VITE_API_BASE (can be full URL or hostname).
  const envBase = process.env.VITE_API_BASE || process.env.VITE_API_HOST || '';
  const API_TARGET = envBase
    ? (envBase.startsWith('http') ? envBase : `https://${envBase}`)
    : 'http://localhost:3000';

  return {
    plugins: [react()],
    server: {
      // Proxy API calls in development to avoid CORS and preflight issues.
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
