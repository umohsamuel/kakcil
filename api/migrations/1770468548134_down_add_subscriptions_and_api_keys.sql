-- Drop triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS user_api_keys;

-- Remove columns from users
ALTER TABLE users 
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_status;