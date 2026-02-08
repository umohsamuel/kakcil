-- Drop triggers
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON subscription_invoices;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_paystack_plans_updated_at ON paystack_plans;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS subscription_invoices;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS paystack_plans;

-- Remove columns from users (only subscription-related columns)
ALTER TABLE users 
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_status;

-- Note: We keep the update_updated_at_column function 
-- because it might be used by other tables