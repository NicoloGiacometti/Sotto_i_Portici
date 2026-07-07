import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Sotto-i-Portici/',
  root: '.',
  publicDir: 'public',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
