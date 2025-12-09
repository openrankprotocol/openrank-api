-- Migration: Add Discord OpenRank tables to socialrank schema
-- Created: 2025-12-09
-- Description: Adds runs, seeds, and scores tables for Discord OpenRank computation

BEGIN;

-- Create runs table
CREATE TABLE IF NOT EXISTS socialrank.runs (
    run_id SERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (server_id) REFERENCES socialrank.servers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_socialrank_runs_server_id ON socialrank.runs(server_id);
CREATE INDEX IF NOT EXISTS idx_socialrank_runs_created_at ON socialrank.runs(created_at DESC);

-- Create seeds table with user IDs and scores
CREATE TABLE IF NOT EXISTS socialrank.seeds (
    server_id BIGINT NOT NULL,
    run_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    score DOUBLE PRECISION,
    PRIMARY KEY (server_id, run_id, user_id),
    FOREIGN KEY (server_id) REFERENCES socialrank.servers(id) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES socialrank.runs(run_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_socialrank_seeds_server_run ON socialrank.seeds(server_id, run_id);
CREATE INDEX IF NOT EXISTS idx_socialrank_seeds_score ON socialrank.seeds(score DESC);

-- Create scores table with user IDs and score values
CREATE TABLE IF NOT EXISTS socialrank.scores (
    server_id BIGINT NOT NULL,
    run_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (server_id, run_id, user_id),
    FOREIGN KEY (server_id) REFERENCES socialrank.servers(id) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES socialrank.runs(run_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_socialrank_scores_server_run ON socialrank.scores(server_id, run_id);
CREATE INDEX IF NOT EXISTS idx_socialrank_scores_value ON socialrank.scores(value DESC);

-- Grant permissions to k3l_readonly
GRANT SELECT ON socialrank.runs TO k3l_readonly;
GRANT SELECT ON socialrank.seeds TO k3l_readonly;
GRANT SELECT ON socialrank.scores TO k3l_readonly;

COMMIT;
