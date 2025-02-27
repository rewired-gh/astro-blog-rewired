-- Drop existing tables first
DROP TABLE IF EXISTS schema_version;
DROP TABLE IF EXISTS comments;

-- Comments table to store all blog post comments
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    content TEXT NOT NULL,
    ip TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (length(sender_name) > 0 AND length(sender_name) <= 63),
    CHECK (sender_email IS NULL OR (length(sender_email) > 0 AND length(sender_email) <= 127)),
    CHECK (length(content) > 0 AND length(content) <= 560)
);

-- Create index on post_id for quickly finding all comments for a specific post
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Create index on timestamp for efficient sorting and filtering by date
-- This helps admins quickly find oldest comments across all posts
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Composite index to efficiently get comments for a post sorted by timestamp
-- This optimizes the common query pattern of displaying comments for a post
CREATE INDEX idx_comments_post_timestamp ON comments(post_id, created_at);

-- Schema version tracking for future upgrades
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize schema version
INSERT INTO schema_version (version) VALUES (1);
