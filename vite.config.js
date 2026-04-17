import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Load environment variables for the current mode
    const env = loadEnv(mode, process.cwd(), '');

    // In development always proxy to localhost:3000 to avoid CORS.
    // In production use VITE_API_BASE / VITE_API_HOST if provided.
    const envBase = env.VITE_API_BASE || env.VITE_API_HOST || '';
    const API_TARGET = mode === 'development'
    ? 'http://localhost:3000'
    : envBase
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
                    secure: mode !== 'development',
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
