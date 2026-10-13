import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-dev-transform',
        apply: 'serve',
        transformIndexHtml(html: string) {
          // No ambiente de desenvolvimento (dev server), carrega o main.tsx para permitir HMR e TSX
          return html.replace(
            /src=["']\.\/assets\/index\.js["']/g,
            'src="/src/main.tsx"'
          );
        },
      } as Plugin,
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          app: path.resolve(import.meta.dirname || '.', 'index.html'),
        },
        output: {
          entryFileNames: 'assets/index.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
