import { app } from '../../api/index';
import type { APIRoute } from 'astro';

// All HTTP methods under /api/* are forwarded to the Hono application.
export const ALL: APIRoute = (context) => app.fetch(context.request);
