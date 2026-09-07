CREATE TABLE IF NOT EXISTS leaderboard (
  player_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  damage REAL NOT NULL DEFAULT 0 CHECK (damage >= 0),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS leaderboard_damage_idx
  ON leaderboard (damage DESC, updated_at ASC);
