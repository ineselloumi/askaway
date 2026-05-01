-- Add analytics columns to the conversations table

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_logged_in     boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_location    jsonb,
  ADD COLUMN IF NOT EXISTS query_categories text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS message_count    integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_returning_user boolean DEFAULT false;
