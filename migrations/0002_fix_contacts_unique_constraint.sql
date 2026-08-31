-- Fix contacts unique constraint to be per-user instead of per-org
-- Each user should have their own contacts, not shared across the org

-- Drop the old org-level unique index
DROP INDEX IF EXISTS contacts_by_org_channel_handle;

-- Create new user-level unique index
-- This ensures each user can have their own contact for a given channel+handle
CREATE UNIQUE INDEX IF NOT EXISTS contacts_by_user_channel_handle
  ON contacts(user_id, channel, handle);
