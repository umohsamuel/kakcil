
CREATE TABLE council_responses (
                                   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   chat_id UUID NOT NULL,
                                   user_message_id UUID NOT NULL,
                                   model TEXT NOT NULL,
                                   provider TEXT NOT NULL,
                                   content TEXT NOT NULL,
                                   is_winner BOOLEAN NOT NULL DEFAULT FALSE,
                                   votes_received INTEGER DEFAULT 0,
                                   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                                   CONSTRAINT fk_council_responses_chat
                                       FOREIGN KEY (chat_id)
                                           REFERENCES chats(id)
                                           ON DELETE CASCADE,

                                   CONSTRAINT fk_council_responses_user_message
                                       FOREIGN KEY (user_message_id)
                                           REFERENCES chat_messages(id)
                                           ON DELETE CASCADE
);

CREATE INDEX idx_council_responses_chat_id ON council_responses(chat_id);
CREATE INDEX idx_council_responses_user_message_id ON council_responses(user_message_id);
CREATE INDEX idx_council_responses_winner ON council_responses(chat_id, is_winner) WHERE is_winner = TRUE;

-- Add branching support to chat_messages
ALTER TABLE chat_messages
    ADD COLUMN parent_message_id UUID,
ADD COLUMN branch_from_response_id UUID,
ADD COLUMN is_active_branch BOOLEAN DEFAULT TRUE;

ALTER TABLE chat_messages
    ADD CONSTRAINT fk_messages_parent
        FOREIGN KEY (parent_message_id)
            REFERENCES chat_messages(id)
            ON DELETE CASCADE;

ALTER TABLE chat_messages
    ADD CONSTRAINT fk_messages_branch_response
        FOREIGN KEY (branch_from_response_id)
            REFERENCES council_responses(id)
            ON DELETE SET NULL;

CREATE INDEX idx_chat_messages_parent ON chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_branch ON chat_messages(branch_from_response_id);
CREATE INDEX idx_chat_messages_active_branch ON chat_messages(chat_id, is_active_branch) WHERE is_active_branch = TRUE;

-- create chat_branches table for branch management
CREATE TABLE chat_branches (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               chat_id UUID NOT NULL,
                               branch_name TEXT,
                               branched_from_message_id UUID,
                               branched_from_response_id UUID,
                               is_main_branch BOOLEAN DEFAULT FALSE,
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                               CONSTRAINT fk_chat_branches_chat
                                   FOREIGN KEY (chat_id)
                                       REFERENCES chats(id)
                                       ON DELETE CASCADE,

                               CONSTRAINT fk_chat_branches_message
                                   FOREIGN KEY (branched_from_message_id)
                                       REFERENCES chat_messages(id)
                                       ON DELETE SET NULL,

                               CONSTRAINT fk_chat_branches_response
                                   FOREIGN KEY (branched_from_response_id)
                                       REFERENCES council_responses(id)
                                       ON DELETE SET NULL
);

CREATE INDEX idx_chat_branches_chat_id ON chat_branches(chat_id);

ALTER TABLE chat_messages ADD COLUMN branch_id UUID;

ALTER TABLE chat_messages
    ADD CONSTRAINT fk_messages_branch
        FOREIGN KEY (branch_id)
            REFERENCES chat_branches(id)
            ON DELETE SET NULL;

CREATE INDEX idx_chat_messages_branch_id ON chat_messages(branch_id);