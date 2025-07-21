-- Create a table to store custom usernames (additional emails) for users.
-- Each user can have up to a certain limit of these custom usernames.
CREATE TABLE IF NOT EXISTS custom_usernames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensures a user cannot add the same username more than once.
    UNIQUE(user_id, username)
);

-- Add a comment to the table for clarity in database inspection tools.
COMMENT ON TABLE custom_usernames IS 'Stores custom usernames (additional emails) that users can add to their account for generating aliases.';
