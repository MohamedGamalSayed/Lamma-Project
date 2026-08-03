-- Run this once in the Supabase SQL editor (or via psql) to create your tables.
-- Week 1: just the users table. We'll add servers/channels/messages in Week 3.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(32) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Speeds up login lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
