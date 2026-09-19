-- A permanent order tombstone prevents repeat generation after reading expiry.
CREATE TABLE reading_orders (
  session_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK(status IN ('writing','ready','failed')),
  reading TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  delivery TEXT NOT NULL DEFAULT 'pending' CHECK(delivery IN ('pending','sent','review')),
  delivery_started INTEGER,
  delivery_payload TEXT
);
