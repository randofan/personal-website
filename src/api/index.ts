import { Hono } from 'hono';
import type { AppEnv } from './env';
import { healthRoute } from './routes/health';
import { guestbookRoute } from './routes/guestbook';

// Base path mirrors the Astro folder: src/pages/api/
export const app = new Hono<AppEnv>().basePath('/api');

const routes = app
  .route('/health', healthRoute)
  .route('/guestbook', guestbookRoute)

// Export the inferred type tree for the Lit frontend RPC client
export type AppType = typeof routes;
