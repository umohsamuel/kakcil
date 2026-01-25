-- Drop trigger first
DROP TRIGGER IF EXISTS update_council_members_updated_at ON council_members;

-- Drop indexes
DROP INDEX IF EXISTS idx_council_members_active;
DROP INDEX IF EXISTS idx_council_members_user_id;

-- Drop table (CASCADE will remove foreign key constraints)
DROP TABLE IF EXISTS council_members CASCADE;