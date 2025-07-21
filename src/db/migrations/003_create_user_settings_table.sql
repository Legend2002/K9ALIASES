-- Step 1: Create the new user_settings table
-- This table will hold all preferences and profile information for a user.
-- It is linked to the main users table with a foreign key.
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    default_alias_count INTEGER DEFAULT 1,
    default_alias_length INTEGER DEFAULT 12,
    notify_on_alias_creation BOOLEAN DEFAULT FALSE,
    notify_on_security_event BOOLEAN DEFAULT TRUE,
    send_weekly_summary BOOLEAN DEFAULT FALSE,
    alias_separator VARCHAR(1) DEFAULT '-',
    alias_case TEXT DEFAULT 'mixed' CHECK (alias_case IN ('mixed', 'lowercase', 'uppercase')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Migrate existing data from the users table to user_settings
-- This ensures that no user data is lost during the refactor.
INSERT INTO user_settings (
    user_id,
    display_name,
    first_name,
    last_name,
    theme,
    default_alias_count,
    default_alias_length,
    notify_on_alias_creation,
    notify_on_security_event,
    send_weekly_summary
)
SELECT
    id,
    display_name,
    first_name,
    last_name,
    theme,
    default_alias_count,
    default_alias_length,
    notify_on_alias_creation,
    notify_on_security_event,
    send_weekly_summary
FROM
    users;

-- Step 3: Remove the old, redundant columns from the users table
-- This declutters the users table, leaving it focused on authentication.
ALTER TABLE users DROP COLUMN display_name;
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
ALTER TABLE users DROP COLUMN theme;
ALTER TABLE users DROP COLUMN default_alias_count;
ALTER TABLE users DROP COLUMN default_alias_length;
ALTER TABLE users DROP COLUMN notify_on_alias_creation;
ALTER TABLE users DROP COLUMN notify_on_security_event;
ALTER TABLE users DROP COLUMN send_weekly_summary;

-- Optional: If these columns were added to the users table by mistake, this will remove them too.
ALTER TABLE users DROP COLUMN IF EXISTS alias_separator;
ALTER TABLE users DROP COLUMN IF EXISTS alias_case;
