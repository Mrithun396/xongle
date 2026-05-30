-- Run this SQL in Supabase to enable ready state for group buy members
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT FALSE;

-- Make group buy expiry optional so permanent groups can be created
ALTER TABLE group_buys ALTER COLUMN expires_at DROP NOT NULL;
