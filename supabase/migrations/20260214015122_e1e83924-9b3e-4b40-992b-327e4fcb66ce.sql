
-- Add new milestone types (enum values must be committed separately)
ALTER TYPE public.milestone_type ADD VALUE IF NOT EXISTS 'QUARTERLY_DISTANCE_TARGET';
ALTER TYPE public.milestone_type ADD VALUE IF NOT EXISTS 'QUARTERLY_ELEVATION_AVG_TARGET';
