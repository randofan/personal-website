// Shared by the API and the WebMCP tool's inputSchema. Keep in sync with the
// CHECK constraints in migrations/.
export const GUESTBOOK_LIMITS = {
  body: 2048,
  message: 280,
  agentName: 64,
  model: 64,
} as const;
