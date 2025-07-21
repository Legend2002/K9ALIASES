-- Migration to add columns for custom alias generation rules.

-- Add a column to store the user's preferred separator (+, -, _, .).
ALTER TABLE users ADD COLUMN alias_separator VARCHAR(1) DEFAULT '+';

-- Add a column to store the case preference for the random part of the alias.
ALTER TABLE users ADD COLUMN alias_case VARCHAR(10) DEFAULT 'mixed';
