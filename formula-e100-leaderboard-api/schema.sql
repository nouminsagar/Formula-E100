CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'hard', 'realism')),
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  score INTEGER CHECK (score IS NULL OR score >= 0),
  distance_metres REAL CHECK (distance_metres IS NULL OR distance_metres >= 0),
  sugarcane_count INTEGER CHECK (sugarcane_count IS NULL OR sugarcane_count >= 0),
  full_speed_score REAL CHECK (full_speed_score IS NULL OR full_speed_score >= 0),
  highest_tier INTEGER CHECK (highest_tier IS NULL OR highest_tier BETWEEN 1 AND 4),
  run_duration_seconds REAL CHECK (run_duration_seconds IS NULL OR run_duration_seconds >= 0),
  build_version TEXT,
  qualified INTEGER NOT NULL DEFAULT 0 CHECK (qualified IN (0, 1)),
  submitted INTEGER NOT NULL DEFAULT 0 CHECK (submitted IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE,
  initials TEXT NOT NULL CHECK (length(initials) = 3 AND initials GLOB '[A-Z0-9][A-Z0-9][A-Z0-9]'),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'hard', 'realism')),
  score INTEGER NOT NULL CHECK (score >= 0),
  distance_metres REAL NOT NULL CHECK (distance_metres >= 0),
  sugarcane_count INTEGER NOT NULL CHECK (sugarcane_count >= 0),
  full_speed_score REAL NOT NULL CHECK (full_speed_score >= 0),
  highest_tier INTEGER NOT NULL CHECK (highest_tier BETWEEN 1 AND 4),
  run_duration_seconds REAL NOT NULL CHECK (run_duration_seconds >= 0),
  build_version TEXT NOT NULL CHECK (length(build_version) <= 32),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  action TEXT NOT NULL,
  bucket_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (key, action, bucket_start)
);

CREATE INDEX IF NOT EXISTS idx_scores_difficulty_rank
  ON scores (difficulty, score DESC, created_at ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_runs_created_at
  ON runs (created_at);

CREATE INDEX IF NOT EXISTS idx_runs_submitted_state
  ON runs (submitted, qualified, finished_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket
  ON rate_limits (bucket_start);
