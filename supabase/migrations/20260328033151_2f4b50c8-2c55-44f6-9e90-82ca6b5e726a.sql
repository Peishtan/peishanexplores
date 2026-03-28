
CREATE TABLE public.quarter_goal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  goal_hiking_quarterly_miles integer NOT NULL,
  goal_kayak_quarterly_miles integer NOT NULL,
  goal_elevation_avg integer NOT NULL,
  goal_exercises_per_week integer NOT NULL,
  goal_outdoor_per_week integer NOT NULL,
  goal_kayak_per_week integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, quarter)
);

ALTER TABLE public.quarter_goal_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.quarter_goal_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON public.quarter_goal_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
