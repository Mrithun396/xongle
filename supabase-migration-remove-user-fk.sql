-- Remove FK constraints on creator_id and user_id so auth user IDs may be stored without requiring a users table row.
ALTER TABLE group_buys DROP CONSTRAINT IF EXISTS group_buys_creator_id_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
-- If your database auto-created indexes or constraints with different names, update the names above accordingly.
