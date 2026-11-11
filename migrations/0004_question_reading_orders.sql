-- On-page Question Reading orders ($26 12-Month Timing Map · $39 Chemistry Check).
-- Lifecycle: pending_payment -> generating_angles -> awaiting_approval -> sent (or expired / refunded).
CREATE TABLE IF NOT EXISTS question_reading_orders (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT UNIQUE,
  track TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  birth1 TEXT NOT NULL,
  name1 TEXT NOT NULL DEFAULT '',
  birth2 TEXT NOT NULL DEFAULT '',
  name2 TEXT NOT NULL DEFAULT '',
  rel2 TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL,
  delivery_channel TEXT NOT NULL DEFAULT 'email',
  buyer_email TEXT NOT NULL DEFAULT '',
  buyer_phone TEXT NOT NULL DEFAULT '',
  sms_consent INTEGER NOT NULL DEFAULT 0,
  placement TEXT NOT NULL DEFAULT '',
  source_path TEXT NOT NULL DEFAULT '',
  attribution_json TEXT NOT NULL DEFAULT '{}',
  engine_facts_json TEXT,
  angles_json TEXT,
  steering_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_payment',
  approved_angle INTEGER,
  approved_subject TEXT,
  approved_body TEXT,
  approved_sms_body TEXT,
  delivery_log_json TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  angles_ready_at INTEGER,
  sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_question_reading_orders_status_created
  ON question_reading_orders (status, created_at DESC);
