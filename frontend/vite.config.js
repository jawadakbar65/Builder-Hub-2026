import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In local development (and when serving the built app with `vite preview`) the
// browser calls the API on the same origin and Vite proxies /api to the backend,
// so no CORS setup or VITE_API_URL is required.
const apiProxy = {
  '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['@imgly/background-removal'] },
  server: { host: '127.0.0.1', port: 5173, proxy: apiProxy },
  preview: { host: '127.0.0.1', port: 4173, proxy: apiProxy },
});
