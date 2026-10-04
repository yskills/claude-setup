-- One row per order, written as 'pending' when the buyer presses "Zahlungspflichtig bestellen",
-- before Stripe is called, so the server, not the browser, decides what was bought.
-- status: pending, paid, failed, expired, shipped, refunded, disputed.
-- items: JSON [{ id, name, quantity, unitAmount }]. shipping: JSON { address, rate }.
-- Unpaid orders are deleted after 30 days (createPendingOrder), so their addresses do not pile up.
CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items TEXT NOT NULL,
  country TEXT NOT NULL,
  amount_total INTEGER,
  currency TEXT NOT NULL DEFAULT 'eur',
  email TEXT,
  shipping TEXT,
  stripe_session_id TEXT UNIQUE,
  payment_intent TEXT,
  livemode INTEGER,
  tracking TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  fulfilled_at INTEGER
);
CREATE INDEX orders_payment_intent_idx ON orders (payment_intent);
CREATE INDEX orders_status_idx ON orders (status, created_at);
