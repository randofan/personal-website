// Hono environment shared by all API routes. `cf` is passed in explicitly by
// the Astro catch-all route because Astro may hand Hono a copy of the request
// that no longer carries `request.cf`.
export type AppEnv = {
  Bindings: Env & { cf?: IncomingRequestCfProperties };
};
