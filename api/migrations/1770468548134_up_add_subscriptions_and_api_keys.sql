-- Add columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (
  subscription_tier IN ('free', 'plus', 'pro')
 ),
 ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
  subscription_status IN (
   'active',
   'canceled',
   'past_due',
   'trialing',
   'paused'
  )
 );

-- Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider VARCHAR(50) NOT NULL CHECK (
  provider IN ('openai', 'anthropic', 'google')
 ),
 encrypted_key TEXT NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partial unique index (only one active key per provider per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_unique_active ON user_api_keys(user_id, provider)
WHERE is_active = true;

-- Create regular indexes for user_api_keys
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
 stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
 plan_id VARCHAR(255) NOT NULL,
 status VARCHAR(30) NOT NULL CHECK (
  status IN (
   'active',
   'canceled',
   'incomplete',
   'incomplete_expired',
   'past_due',
   'trialing',
   'unpaid',
   'paused'
  )
 ),
 current_period_end TIMESTAMPTZ NOT NULL,
 cancel_at TIMESTAMPTZ,
 canceled_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at BEFORE
UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE
UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();