-- Coms Database Schema
-- Initial migration for D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Platform connections (OAuth tokens)
CREATE TABLE IF NOT EXISTS platform_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('gmail', 'outlook', 'slack', 'discord', 'whatsapp', 'teams', 'imessage')),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_iv TEXT NOT NULL,
  token_expires_at INTEGER,
  platform_user_id TEXT,
  platform_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  last_sync_at INTEGER,
  sync_cursor TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, platform)
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_type TEXT DEFAULT 'other' CHECK (contact_type IN ('Client', 'Subcontractor', 'Vendor', 'Personal', 'other')),
  connection_strength TEXT DEFAULT 'Regular' CHECK (connection_strength IN ('Close', 'Regular', 'Occasional', 'New')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Contact identities (maps platform-specific IDs to contacts)
CREATE TABLE IF NOT EXISTS contact_identities (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(contact_id, platform, platform_user_id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_thread_id TEXT,
  is_read INTEGER DEFAULT 0,
  is_responded INTEGER DEFAULT 0,
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
  is_time_sensitive INTEGER DEFAULT 0,
  last_message_at INTEGER,
  last_message_preview TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, platform, platform_thread_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_message_id TEXT,
  content TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  timestamp INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(platform, platform_message_id)
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_tab TEXT DEFAULT 'all' CHECK (default_tab IN ('all', 'unread', 'needs', 'done', 'urgent')),
  notify INTEGER DEFAULT 1,
  notify_deadlines INTEGER DEFAULT 1,
  notify_flagged INTEGER DEFAULT 1,
  notify_unread INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_last_message ON conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(conversation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_identities_contact ON contact_identities(contact_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id);
