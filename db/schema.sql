-- Optional SQLite schema for persisting experiment results.
-- The CLI and HTTP API do not read or write this database.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS experiment_runs (
  id INTEGER PRIMARY KEY,
  experiment TEXT NOT NULL CHECK (experiment IN ('odd_search', 'parity_sample', 'pisano')),
  application_version TEXT NOT NULL CHECK (length(application_version) BETWEEN 1 AND 64),
  runtime_version TEXT NOT NULL CHECK (length(runtime_version) BETWEEN 1 AND 64),
  started_at TEXT NOT NULL CHECK (started_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  duration_ms REAL NOT NULL CHECK (duration_ms >= 0)
) STRICT;

CREATE TABLE IF NOT EXISTS odd_search_results (
  run_id INTEGER PRIMARY KEY REFERENCES experiment_runs (id) ON DELETE CASCADE,
  target INTEGER NOT NULL CHECK (target >= 1),
  include_seeds INTEGER NOT NULL CHECK (include_seeds IN (0, 1)),
  sequence_length INTEGER NOT NULL CHECK (sequence_length >= 1),
  odd_count INTEGER NOT NULL CHECK (odd_count = target),
  even_count INTEGER NOT NULL CHECK (even_count = sequence_length / 3),
  terminal_value TEXT NOT NULL CHECK (terminal_value <> '' AND terminal_value NOT GLOB '*[^0-9]*')
) STRICT;

CREATE TABLE IF NOT EXISTS parity_sample_results (
  run_id INTEGER PRIMARY KEY REFERENCES experiment_runs (id) ON DELETE CASCADE,
  samples INTEGER NOT NULL CHECK (samples >= 1),
  max_index INTEGER NOT NULL CHECK (max_index >= 1),
  seed INTEGER NOT NULL CHECK (seed BETWEEN 0 AND 4294967295),
  odd_count INTEGER NOT NULL CHECK (odd_count BETWEEN 0 AND samples),
  estimate REAL NOT NULL CHECK (estimate BETWEEN 0 AND 1),
  exact_proportion REAL NOT NULL CHECK (exact_proportion BETWEEN 0 AND 1),
  ci95_lower REAL NOT NULL CHECK (ci95_lower BETWEEN 0 AND 1),
  ci95_upper REAL NOT NULL CHECK (ci95_upper BETWEEN 0 AND 1),
  CHECK (ci95_lower <= estimate AND estimate <= ci95_upper)
) STRICT;

CREATE TABLE IF NOT EXISTS pisano_results (
  run_id INTEGER PRIMARY KEY REFERENCES experiment_runs (id) ON DELETE CASCADE,
  modulus INTEGER NOT NULL CHECK (modulus >= 1),
  period INTEGER NOT NULL CHECK (period >= 1 AND period <= 6 * modulus)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_experiment_runs_experiment_started
  ON experiment_runs (experiment, started_at);
