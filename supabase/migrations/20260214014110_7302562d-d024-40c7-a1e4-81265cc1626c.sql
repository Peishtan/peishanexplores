
-- Milestone type enum
CREATE TYPE public.milestone_type AS ENUM (
  'COUNT_ACTIVITIES_OVER_DISTANCE',
  'COUNT_ACTIVITIES_OVER_ELEVATION',
  'SINGLE_ACTIVITY_OVER_ELEVATION',
  'SINGLE_ACTIVITY_OVER_DISTANCE',
  'STREAK_WEEKLY_MINIMUM'
);

-- Window type enum
-- 'quarter' = calendar quarter (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec) based on log date
CREATE TYPE public.window_type AS ENUM ('all_time', 'quarter', 'rolling_days');

-- Milestone status enum
CREATE TYPE public.milestone_status AS ENUM ('locked', 'in_progress', 'achieved');

-- Milestone activity type enum (maps to activities.type values)
CREATE TYPE public.milestone_activity_type AS ENUM ('kayak', 'hike', 'ski', 'gym');

-- Skill milestones definitions (global, not per-user)
CREATE TABLE public.skill_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  milestone_type public.milestone_type NOT NULL,
  activity_type public.milestone_activity_type,
  threshold_count INT,
  threshold_distance_mi NUMERIC,
  threshold_elevation_ft INT,
  threshold_duration_min INT,
  window_type public.window_type NOT NULL DEFAULT 'all_time',
  window_days INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed on definitions - they're global and read-only from client
ALTER TABLE public.skill_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read milestones"
  ON public.skill_milestones FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Skill milestone progress (per-user, one row per milestone per user)
CREATE TABLE public.skill_milestone_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES public.skill_milestones(id) ON DELETE CASCADE,
  status public.milestone_status NOT NULL DEFAULT 'locked',
  progress_current INT NOT NULL DEFAULT 0,
  progress_target INT NOT NULL DEFAULT 1,
  achieved_at TIMESTAMPTZ,
  evidence_log_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

ALTER TABLE public.skill_milestone_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.skill_milestone_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.skill_milestone_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.skill_milestone_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_skill_milestone_progress_updated_at
  BEFORE UPDATE ON public.skill_milestone_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed milestones
INSERT INTO public.skill_milestones (title, milestone_type, activity_type, threshold_count, threshold_distance_mi, threshold_elevation_ft, window_type) VALUES
  ('3 hikes over 10 miles', 'COUNT_ACTIVITIES_OVER_DISTANCE', 'hike', 3, 10, NULL, 'all_time'),
  ('Reach 1500 ft elevation gain on a hike', 'SINGLE_ACTIVITY_OVER_ELEVATION', 'hike', NULL, NULL, 1500, 'all_time'),
  ('4-week paddle streak', 'STREAK_WEEKLY_MINIMUM', 'kayak', 4, NULL, NULL, 'all_time'),
  ('3 hikes over 1500 ft', 'COUNT_ACTIVITIES_OVER_ELEVATION', 'hike', 3, NULL, 1500, 'all_time');
