-- SQL commands to add notification preferences to the 'users' table.
-- Run these commands against your PostgreSQL database.

-- Adds a column to control notifications for new alias creation.
-- Defaults to FALSE, so users are not opted-in by default.
ALTER TABLE users ADD COLUMN notify_on_alias_creation BOOLEAN DEFAULT FALSE;

-- Adds a column for important security event notifications (e.g., new device login).
-- Defaults to TRUE, as these are generally important for users to receive.
ALTER TABLE users ADD COLUMN notify_on_security_event BOOLEAN DEFAULT TRUE;

-- Adds a column for a weekly activity summary email.
-- Defaults to FALSE, so users must opt-in.
ALTER TABLE users ADD COLUMN send_weekly_summary BOOLEAN DEFAULT FALSE;
