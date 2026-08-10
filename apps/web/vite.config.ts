import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/fragments/' : '/',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // The in-app browser connects from outside Vite's process, so localhost-only
  // binding would make the development page appear unavailable.
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/fragments': 'http://localhost:3001' }
  }
});
