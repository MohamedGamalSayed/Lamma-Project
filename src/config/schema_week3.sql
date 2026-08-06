-- Week 3: Run this in Supabase's SQL Editor (same place as schema.sql before).
-- This ADDS new tables — it doesn't touch your existing "users" table.

-- A "server" is a community, like a Discord server (e.g. "My Class Group")
CREATE TABLE IF NOT EXISTS servers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A "channel" lives inside a server, like #general or #homework-help
CREATE TABLE IF NOT EXISTS channels (
  id          SERIAL PRIMARY KEY,
  server_id   INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracks which users belong to which servers, and their role in it
CREATE TABLE IF NOT EXISTS memberships (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id   INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, server_id) -- a user can only join a server once
);

-- The actual chat messages
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  channel_id      INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT,
  attachment_url  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reactions (emoji) on messages. UNIQUE constraint lets the socket handler
-- use ON CONFLICT DO NOTHING so the same user clicking the same emoji twice
-- is a no-op instead of an error.
CREATE TABLE IF NOT EXISTS reactions (
  id          SERIAL PRIMARY KEY,
  message_id  INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       VARCHAR(16) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);

-- Speeds up "get all channels for this server" and "get all messages for this channel"
CREATE INDEX IF NOT EXISTS idx_channels_server ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_server ON memberships(server_id);
