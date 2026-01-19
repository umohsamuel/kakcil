CREATE TYPE chat_role AS ENUM (
    'system',
    'user',
    'assistant',
    'tool'
);

CREATE TABLE chat_messages (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

                               chat_id UUID NOT NULL,
                               user_id UUID, -- NULL for assistant/tool messages

                               role chat_role NOT NULL,
                               content TEXT NOT NULL,

                               model TEXT,                 -- model used for assistant messages

                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                               CONSTRAINT fk_messages_chat
                                   FOREIGN KEY (chat_id)
                                       REFERENCES chats(id)
                                       ON DELETE CASCADE,

                               CONSTRAINT fk_messages_user
                                   FOREIGN KEY (user_id)
                                       REFERENCES users(id)
                                       ON DELETE SET NULL
);

CREATE INDEX idx_chat_messages_chat_id
    ON chat_messages(chat_id);

CREATE INDEX idx_chat_messages_chat_id_created_at
    ON chat_messages(chat_id, created_at);

CREATE INDEX idx_chat_messages_role
    ON chat_messages(role);
