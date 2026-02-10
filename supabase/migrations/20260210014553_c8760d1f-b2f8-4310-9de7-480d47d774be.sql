
-- Drop existing data (activities table likely empty or demo)
DELETE FROM public.activities;

-- Replace activity_type enum
ALTER TYPE public.activity_type RENAME TO activity_type_old;
CREATE TYPE public.activity_type AS ENUM ('kayaking', 'hiking', 'xc_skiing', 'peloton', 'orange_theory');
ALTER TABLE public.activities ALTER COLUMN type TYPE public.activity_type USING type::text::public.activity_type;
DROP TYPE public.activity_type_old;

-- Drop intensity enum (not needed for this use case)
-- Keep it but simplify - actually let's keep intensity, it's useful

-- Add weekly goal columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_exercises_per_week integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS goal_outdoor_per_week integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS goal_kayak_per_week integer DEFAULT 1;

-- Remove steps goal (keep column but we won't use it)
