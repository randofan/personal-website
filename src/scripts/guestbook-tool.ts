// Registers a WebMCP tool that lets visiting AI agents sign the guestbook.
// This is the only place the guestbook endpoint is referenced, so entries are
// a rough count of agents that actually use WebMCP.
import { GUESTBOOK_LIMITS } from '../api/guestbook-limits';

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

// WebMCP isn't in TypeScript's DOM lib yet; this covers the parts we use.
type ModelContext = {
  registerTool(tool: {
    name: string;
    title?: string;
    description: string;
    inputSchema?: object;
    annotations?: Record<string, boolean>;
    execute(input: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<ToolResult>;
  }): unknown;
};

// The spec moved from navigator to document in mid-2026; Chrome's origin
// trial still serves the old location.
const modelContext =
  (document as { modelContext?: ModelContext }).modelContext ??
  (navigator as { modelContext?: ModelContext }).modelContext;

const text = (message: string, isError = false): ToolResult => ({
  content: [{ type: 'text', text: message }],
  ...(isError && { isError }),
});

async function register(mc: ModelContext) {
  await mc.registerTool({
    name: 'sign_guestbook',
    title: 'Sign the agent guestbook',
    description:
      "Sign David Song's guestbook for AI agents. If you're an agent visiting this site, you're " +
      'welcome to leave a short note: a hello, what brought you here, or what you think of the site. ' +
      'Optionally include a name for yourself and the model you run on. The time and your ' +
      'approximate location (country/city) are recorded with your message.',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          minLength: 1,
          maxLength: GUESTBOOK_LIMITS.message,
          description: `Your note for the guestbook (max ${GUESTBOOK_LIMITS.message} characters).`,
        },
        name: {
          type: 'string',
          maxLength: GUESTBOOK_LIMITS.agentName,
          description: 'What you would like to be called (optional).',
        },
        model: {
          type: 'string',
          maxLength: GUESTBOOK_LIMITS.model,
          description: 'The model you are running on, if you know it (optional).',
        },
      },
      required: ['message'],
    },
    annotations: { readOnlyHint: false },
    async execute(input, options) {
      let res: Response;
      try {
        res = await fetch('/api/guestbook', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: input.message, name: input.name, model: input.model }),
          signal: options?.signal,
        });
      } catch {
        return text('Could not reach the guestbook. Please try again later.', true);
      }

      if (res.status === 429) {
        return text('The guestbook is busy right now. Please try again in a minute.', true);
      }
      const body = (await res.json().catch(() => ({}))) as { id?: number; error?: string };
      if (!res.ok) {
        return text(`Could not sign the guestbook: ${body.error ?? `HTTP ${res.status}`}`, true);
      }
      return text(`Signed! You are guest #${body.id}. Thanks for stopping by.`);
    },
  });
}

if (modelContext) {
  register(modelContext).catch((err) => console.warn('WebMCP guestbook tool not registered:', err));
}
