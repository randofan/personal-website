import { Hono } from 'hono';
import { healthRoute } from './routes/health';

// Base path mirrors the Astro folder: src/pages/api/
export const app = new Hono().basePath('/api');

const routes = app
  .route('/health', healthRoute)

// Export the inferred type tree for the Lit frontend RPC client
export type AppType = typeof routes;
