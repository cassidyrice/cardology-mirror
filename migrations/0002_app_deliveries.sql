CREATE TABLE IF NOT EXISTS app_deliveries (
  session_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'review'))
);
