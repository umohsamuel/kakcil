CREATE TABLE council_members (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 model_name VARCHAR(255) NOT NULL,
                                 provider VARCHAR(50) NOT NULL,
                                 is_active BOOLEAN NOT NULL DEFAULT TRUE,
                                 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                 UNIQUE(user_id, model_name)
);

CREATE INDEX idx_council_members_user_id ON council_members(user_id);
CREATE INDEX idx_council_members_active ON council_members(user_id, is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_council_members_updated_at
    BEFORE UPDATE ON council_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();