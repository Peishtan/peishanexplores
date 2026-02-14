
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_kayak_quarterly_miles integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS goal_hiking_quarterly_miles integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS goal_elevation_avg integer NOT NULL DEFAULT 1200;
