import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { GUESTBOOK_LIMITS } from '../guestbook-limits';

const LIMITS = GUESTBOOK_LIMITS;

type SignRequest = {
  message: string;
  agentName: string | null;
  model: string | null;
};

// Length in code points, which matches SQLite's length() on TEXT.
const charLength = (s: string) => [...s].length;

// Drops control characters; newlines are only kept where allowed.
const clean = (s: string, multiline: boolean) =>
  s
    .replace(/\r\n?/g, '\n')
    .replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '')
    .trim();

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  const text = clean(value, false);
  if (charLength(text) > max) throw new Error(`${field} must be at most ${max} characters`);
  return text || null;
}

function parseSignRequest(body: unknown): SignRequest {
  if (typeof body !== 'object' || body === null) throw new Error('body must be a JSON object');
  const input = body as Record<string, unknown>;

  if (typeof input.message !== 'string') throw new Error('message is required');
  const message = clean(input.message, true);
  if (!message) throw new Error('message must not be empty');
  if (charLength(message) > LIMITS.message) {
    throw new Error(`message must be at most ${LIMITS.message} characters`);
  }

  return {
    message,
    agentName: optionalText(input.name, 'name', LIMITS.agentName),
    model: optionalText(input.model, 'model', LIMITS.model),
  };
}

export const guestbookRoute = new Hono<AppEnv>()
  .post('/', async (c) => {
    // Only the WebMCP tool on this site's own pages calls this endpoint, so
    // anything other than a same-origin browser fetch is turned away.
    const origin = c.req.header('origin');
    if (c.req.header('sec-fetch-site') !== 'same-origin' || origin !== new URL(c.req.url).origin) {
      return c.json({ error: 'forbidden' }, 403);
    }

    const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
    const [perIp, global] = await Promise.all([
      c.env.GUESTBOOK_IP_LIMITER.limit({ key: ip }),
      c.env.GUESTBOOK_GLOBAL_LIMITER.limit({ key: 'global' }),
    ]);
    if (!perIp.success || !global.success) {
      return c.json({ error: 'rate limited, try again in a minute' }, 429);
    }

    const declaredLength = Number(c.req.header('content-length'));
    if (!declaredLength || declaredLength > LIMITS.body) {
      return c.json({ error: `body must be at most ${LIMITS.body} bytes` }, 413);
    }
    const raw = await c.req.text();
    if (raw.length > LIMITS.body) {
      return c.json({ error: `body must be at most ${LIMITS.body} bytes` }, 413);
    }

    let entry: SignRequest;
    try {
      entry = parseSignRequest(JSON.parse(raw));
    } catch (err) {
      const reason = err instanceof SyntaxError ? 'body must be valid JSON' : (err as Error).message;
      return c.json({ error: reason }, 400);
    }

    const cf = c.env.cf;

    const row = await c.env.GUESTBOOK_DB.prepare(
      `INSERT INTO guestbook_entries (message, agent_name, model, country, region, city)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, created_at`,
    )
      .bind(
        entry.message,
        entry.agentName,
        entry.model,
        cf?.country ?? null,
        cf?.region ?? null,
        cf?.city ?? null,
      )
      .first<{ id: number; created_at: string }>();

    return c.json({ id: row!.id, createdAt: row!.created_at }, 201);
  });
