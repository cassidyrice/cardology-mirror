-- Keep a paid tombstone for webhook retries. Clear the birthday when marking the PDF sent.
CREATE TABLE blueprint_checkout_orders (
  id TEXT PRIMARY KEY NOT NULL,
  attempt_id TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT UNIQUE,
  birth_month INTEGER,
  birth_day INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  paid_at INTEGER,
  claimed_at INTEGER,
  fulfilled_at INTEGER,
  CHECK (paid_at IS NULL OR stripe_session_id IS NOT NULL),
  CHECK (claimed_at IS NULL OR paid_at IS NOT NULL),
  CHECK (
    (fulfilled_at IS NULL AND birth_month IS NOT NULL AND birth_day IS NOT NULL
      AND birth_month BETWEEN 1 AND 12
      AND birth_day BETWEEN 1 AND CASE WHEN birth_month=2 THEN 29 WHEN birth_month IN (4,6,9,11) THEN 30 ELSE 31 END)
    OR (fulfilled_at IS NOT NULL AND claimed_at IS NOT NULL AND birth_month IS NULL AND birth_day IS NULL)
  )
);
