import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        klockan: path.resolve(__dirname, 'games/klockan/index.html'),
        tetris: path.resolve(__dirname, 'games/tetris/index.html'),
        'bouncing-babies': path.resolve(__dirname, 'games/bouncing-babies/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
