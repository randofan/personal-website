import { app } from '../../api/index';
import type { APIRoute } from 'astro';

// All HTTP methods under /api/* are forwarded to the Hono application.
export const ALL: APIRoute = ({ request, locals }) => {
  const { env, cf, ctx } = locals.runtime;
  return app.fetch(request, { ...env, cf }, ctx);
};
