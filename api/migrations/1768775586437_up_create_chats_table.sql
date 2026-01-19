CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE chats (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

                       user_id UUID NOT NULL,

                       title TEXT,                              -- optional chat title
                       system_prompt TEXT,                     -- optional system context
                       model TEXT NOT NULL,                    -- e.g. gpt-4o, claude, etc.

                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       last_message_at TIMESTAMPTZ,

                       CONSTRAINT fk_chats_user
                           FOREIGN KEY (user_id)
                               REFERENCES users(id)
                               ON DELETE CASCADE
);

CREATE INDEX idx_chats_user_id
    ON chats(user_id);

CREATE INDEX idx_chats_last_message_at
    ON chats(last_message_at DESC);


