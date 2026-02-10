
-- Revert paystack_plans table
ALTER TABLE paystack_plans 
  ALTER COLUMN paystack_plan_id TYPE INTEGER;

-- Revert subscriptions table
ALTER TABLE subscriptions 
  ALTER COLUMN paystack_subscription_id TYPE INTEGER,
  ALTER COLUMN paystack_customer_id TYPE INTEGER;

-- Revert subscription_invoices table
ALTER TABLE subscription_invoices 
  ALTER COLUMN paystack_transaction_id TYPE INTEGER;

-- Revert payments table
ALTER TABLE payments 
  ALTER COLUMN paystack_transaction_id TYPE INTEGER;