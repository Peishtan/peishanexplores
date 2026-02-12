
-- Add CHECK constraints for numeric input validation

-- Weight entries: weight must be positive and reasonable
ALTER TABLE weight_entries ADD CONSTRAINT weight_check CHECK (weight > 0 AND weight < 1000);

-- Activities: distance, duration, calories must be in reasonable ranges
ALTER TABLE activities ADD CONSTRAINT distance_check CHECK (distance IS NULL OR (distance >= 0 AND distance < 1000));
ALTER TABLE activities ADD CONSTRAINT duration_check CHECK (duration >= 0 AND duration < 10000);
ALTER TABLE activities ADD CONSTRAINT calories_check CHECK (calories IS NULL OR (calories >= 0 AND calories < 50000));

-- Profiles: goal values must be non-negative and reasonable
ALTER TABLE profiles ADD CONSTRAINT goals_weight_check CHECK (goal_weight IS NULL OR (goal_weight > 0 AND goal_weight < 1000));
ALTER TABLE profiles ADD CONSTRAINT goals_exercises_check CHECK (goal_exercises_per_week IS NULL OR goal_exercises_per_week >= 0);
ALTER TABLE profiles ADD CONSTRAINT goals_outdoor_check CHECK (goal_outdoor_per_week IS NULL OR goal_outdoor_per_week >= 0);
ALTER TABLE profiles ADD CONSTRAINT goals_kayak_check CHECK (goal_kayak_per_week IS NULL OR goal_kayak_per_week >= 0);
