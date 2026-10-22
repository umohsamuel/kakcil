DELETE FROM user_api_keys WHERE provider IN ('deepseek', 'xai', 'kimi');

ALTER TABLE user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE user_api_keys
  ADD CONSTRAINT user_api_keys_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'google'));
