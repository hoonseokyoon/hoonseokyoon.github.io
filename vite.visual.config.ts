import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'tests/visual',
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve('./src/lib')
    }
  },
  server: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true
  }
});
