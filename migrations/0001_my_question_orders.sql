CREATE TABLE IF NOT EXISTS my_question_orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'checkout_pending'
    CHECK (status IN (
      'checkout_pending',
      'paid_awaiting_intake',
      'ready',
      'in_production',
      'delivered',
      'refunded',
      'closed'
    )),
  primary_birthdate TEXT NOT NULL,
  include_question_blueprint INTEGER NOT NULL DEFAULT 0
    CHECK (include_question_blueprint IN (0, 1)),
  customer_email TEXT,
  customer_name TEXT,
  question TEXT,
  relevant_birthdates_json TEXT NOT NULL DEFAULT '[]',
  amount_cents INTEGER,
  fulfillment_date TEXT,
  slot_number INTEGER CHECK (slot_number IS NULL OR slot_number BETWEEN 1 AND 3),
  delivery_url TEXT,
  created_at TEXT NOT NULL,
  checkout_expires_at TEXT NOT NULL,
  stripe_session_attached_at TEXT,
  paid_at TEXT,
  onboarding_completed_at TEXT,
  production_started_at TEXT,
  delivered_at TEXT,
  details_purge_after TEXT,
  manual_extension_until TEXT,
  reminder_1h_sent_at TEXT,
  reminder_24h_sent_at TEXT,
  reminder_72h_sent_at TEXT,
  customer_payment_email_sent_at TEXT,
  creator_payment_email_sent_at TEXT,
  customer_onboarding_email_sent_at TEXT,
  creator_onboarding_email_sent_at TEXT,
  delivery_email_sent_at TEXT,
  refund_requested_at TEXT,
  refunded_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE (fulfillment_date, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_my_question_orders_status_paid
  ON my_question_orders (status, paid_at);

CREATE INDEX IF NOT EXISTS idx_my_question_orders_fulfillment
  ON my_question_orders (fulfillment_date, status);

CREATE INDEX IF NOT EXISTS idx_my_question_orders_purge
  ON my_question_orders (details_purge_after)
  WHERE details_purge_after IS NOT NULL;
