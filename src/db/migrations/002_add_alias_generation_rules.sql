-- Add a column to store the user's preferred separator for generated aliases.
-- '+' is a common standard and a good default.
ALTER TABLE users ADD COLUMN alias_separator CHAR(1) DEFAULT '+';

-- Add a column to store the user's preferred case for the random part of the alias.
-- 'mixed' offers the most entropy and is a good default.
ALTER TABLE users ADD COLUMN alias_case VARCHAR(10) DEFAULT 'mixed';
