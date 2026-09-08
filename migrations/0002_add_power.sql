-- 入口のパワースキャン用。連打の戦闘力を既存のリーダーボードに相乗りさせる。
-- 既存行は power=0 で入り、ランキングの母数（power>0）からは外れる。
ALTER TABLE leaderboard ADD COLUMN power REAL NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS leaderboard_power_idx
  ON leaderboard (power DESC);
