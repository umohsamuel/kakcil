-- Add subscription columns to users table (if not already added)
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
    'paused',
    'non-renewing'
  )
);

-- Create paystack_plans table to mirror Paystack plans
CREATE TABLE IF NOT EXISTS paystack_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Paystack plan details
  paystack_plan_id INTEGER NOT NULL UNIQUE,
  paystack_plan_code VARCHAR(255) NOT NULL UNIQUE,
  
  -- Plan configuration
  name VARCHAR(255) NOT NULL,
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('hourly', 'daily', 'weekly', 'monthly', 'biannually', 'annually')),
  amount INTEGER NOT NULL, -- Amount in kobo
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  
  -- Internal mapping
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'plus', 'pro')),
  
  -- Plan settings
  invoice_limit INTEGER, -- Number of invoices before subscription stops
  send_invoices BOOLEAN DEFAULT false,
  send_sms BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop old subscriptions table if it exists (CAREFUL: this will delete data)
-- Comment out if you need to migrate existing data
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Create new subscriptions table following Paystack subscription model
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Paystack subscription details
  paystack_subscription_id INTEGER NOT NULL UNIQUE,
  paystack_subscription_code VARCHAR(255) NOT NULL UNIQUE,
  paystack_email_token VARCHAR(255) NOT NULL,
  
  -- Customer details
  paystack_customer_id INTEGER NOT NULL,
  paystack_customer_code VARCHAR(255) NOT NULL,
  
  -- Plan reference
  plan_id UUID NOT NULL REFERENCES paystack_plans(id),
  paystack_plan_code VARCHAR(255) NOT NULL,
  
  -- Subscription details
  amount INTEGER NOT NULL, -- Amount in kobo
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Authorization for recurring charges
  paystack_authorization_code VARCHAR(255) NOT NULL,
  card_bin VARCHAR(10),
  card_last4 VARCHAR(4),
  card_type VARCHAR(50),
  card_bank VARCHAR(255),
  card_brand VARCHAR(50),
  card_exp_month VARCHAR(2),
  card_exp_year VARCHAR(4),
  
  -- Status following Paystack model
  status VARCHAR(30) NOT NULL CHECK (
    status IN (
      'active',      -- Subscription is active
      'non-renewing', -- Subscription won't renew (canceled but still active)
      'attention',   -- Requires attention (payment failed)
      'completed',   -- Subscription has ended
      'cancelled'    -- Subscription was cancelled
    )
  ),
  
  -- Invoice tracking
  invoices_count INTEGER NOT NULL DEFAULT 0,
  invoice_limit INTEGER, -- Null means unlimited
  
  -- Subscription period
  next_payment_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  
  -- Integration metadata
  cron_expression VARCHAR(100), -- Paystack's cron expression for the subscription
  most_recent_invoice VARCHAR(255), -- Reference to last invoice
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoices table to track Paystack subscription invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Paystack transaction details (invoices create transactions)
  paystack_transaction_id INTEGER UNIQUE,
  paystack_reference VARCHAR(255) UNIQUE,
  
  -- Invoice details
  amount INTEGER NOT NULL, -- Amount in kobo
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Status
  status VARCHAR(30) NOT NULL CHECK (
    status IN ('pending', 'success', 'failed')
  ),
  
  -- Payment details
  paid_at TIMESTAMPTZ,
  payment_channel VARCHAR(50), -- card, bank, ussd, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table for one-time transactions (non-subscription)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Paystack transaction details
  paystack_transaction_id INTEGER NOT NULL UNIQUE,
  paystack_reference VARCHAR(255) NOT NULL UNIQUE,
  paystack_access_code VARCHAR(255),
  
  -- Payment details
  amount INTEGER NOT NULL, -- Amount in kobo
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  status VARCHAR(30) NOT NULL CHECK (
    status IN ('success', 'failed', 'pending', 'abandoned')
  ),
  
  -- Customer info
  email VARCHAR(255) NOT NULL,
  
  -- Payment purpose
  payment_type VARCHAR(50) CHECK (
    payment_type IN ('subscription_setup', 'one_time', 'upgrade', 'addon')
  ),
  
  -- Authorization details (for card charges)
  authorization_code VARCHAR(255),
  card_bin VARCHAR(10),
  card_last4 VARCHAR(4),
  card_type VARCHAR(50),
  card_bank VARCHAR(255),
  card_brand VARCHAR(50),
  
  -- Transaction metadata
  channel VARCHAR(50), -- card, bank, ussd, etc.
  gateway_response TEXT,
  fees INTEGER, -- Paystack fees in kobo
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for paystack_plans
CREATE INDEX IF NOT EXISTS idx_paystack_plans_tier ON paystack_plans(tier);
CREATE INDEX IF NOT EXISTS idx_paystack_plans_is_active ON paystack_plans(is_active);

-- Create indexes for subscriptions (NOW the columns exist)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_code ON subscriptions(paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Create indexes for subscription_invoices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON subscription_invoices(created_at);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Create or reuse trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at (only for new tables)
DROP TRIGGER IF EXISTS update_paystack_plans_updated_at ON paystack_plans;
CREATE TRIGGER update_paystack_plans_updated_at 
  BEFORE UPDATE ON paystack_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON subscription_invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON subscription_invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();