ALTER TABLE user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE user_api_keys
  ADD CONSTRAINT user_api_keys_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'xai', 'kimi'));
