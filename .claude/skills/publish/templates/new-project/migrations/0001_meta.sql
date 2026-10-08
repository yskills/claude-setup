-- Day-zero table so the first migration runs on live and preview. Migrations stay additive.
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
