import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  optimizeDeps: {
    include: ['@/index']
  },
  publicDir: 'public',
  build: {
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
  },
  assetsInclude: ['**/*.svg'],
}); 