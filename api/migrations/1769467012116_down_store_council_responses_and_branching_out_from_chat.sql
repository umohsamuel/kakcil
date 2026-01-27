-- Drop chat_messages.branch_id column and related constraints
DROP INDEX IF EXISTS idx_chat_messages_branch_id;

ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS fk_messages_branch;

ALTER TABLE chat_messages
DROP COLUMN IF EXISTS branch_id;

-- Drop chat_branches table
DROP INDEX IF EXISTS idx_chat_branches_chat_id;

DROP TABLE IF EXISTS chat_branches CASCADE;

-- Drop chat_messages branching columns and constraints
DROP INDEX IF EXISTS idx_chat_messages_active_branch;
DROP INDEX IF EXISTS idx_chat_messages_branch;
DROP INDEX IF EXISTS idx_chat_messages_parent;

ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS fk_messages_branch_response;

ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS fk_messages_parent;

ALTER TABLE chat_messages
DROP COLUMN IF EXISTS is_active_branch;

ALTER TABLE chat_messages
DROP COLUMN IF EXISTS branch_from_response_id;

ALTER TABLE chat_messages
DROP COLUMN IF EXISTS parent_message_id;

-- Drop council_responses table
DROP INDEX IF EXISTS idx_council_responses_winner;
DROP INDEX IF EXISTS idx_council_responses_user_message_id;
DROP INDEX IF EXISTS idx_council_responses_chat_id;

DROP TABLE IF EXISTS council_responses CASCADE;