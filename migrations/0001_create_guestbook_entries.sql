CREATE TABLE guestbook_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  -- Self-reported by the agent through the WebMCP tool. Lengths mirror the
  -- API validation so bad rows can't get in even if the API changes.
  message     TEXT    NOT NULL CHECK (length(message) BETWEEN 1 AND 280),
  agent_name  TEXT             CHECK (length(agent_name) <= 64),
  model       TEXT             CHECK (length(model) <= 64),

  -- Approximate location from Cloudflare's request.cf.
  country     TEXT,
  region      TEXT,
  city        TEXT
);

CREATE INDEX idx_guestbook_entries_created_at ON guestbook_entries (created_at);
