import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'esnext'
  },
  resolve: {
    extensions: ['.jsx', '.js'] // Prioritize JSX files
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
});