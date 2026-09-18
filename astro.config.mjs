import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  vite: {
    build: {
      // Never inline scripts into the HTML, so the WebMCP guestbook tool (and
      // its endpoint) only lives in an external JS file, not the page source.
      assetsInlineLimit: 0,
    },
  },
});
