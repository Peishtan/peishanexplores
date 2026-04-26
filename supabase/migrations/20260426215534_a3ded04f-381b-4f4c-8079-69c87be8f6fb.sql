CREATE OR REPLACE FUNCTION public.refresh_single_activity_distance_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapped_type public.milestone_activity_type;
  ms record;
  qualifying_ids jsonb;
  first_achieved_at timestamptz;
BEGIN
  mapped_type := CASE NEW.type
    WHEN 'kayaking' THEN 'kayak'::public.milestone_activity_type
    WHEN 'hiking' THEN 'hike'::public.milestone_activity_type
    WHEN 'xc_skiing' THEN 'ski'::public.milestone_activity_type
    WHEN 'peloton' THEN 'gym'::public.milestone_activity_type
    WHEN 'orange_theory' THEN 'gym'::public.milestone_activity_type
    ELSE NULL
  END;

  IF mapped_type IS NULL OR NEW.distance IS NULL THEN
    RETURN NEW;
  END IF;

  FOR ms IN
    SELECT *
    FROM public.skill_milestones
    WHERE is_active = true
      AND milestone_type = 'SINGLE_ACTIVITY_OVER_DISTANCE'
      AND activity_type = mapped_type
      AND threshold_distance_mi IS NOT NULL
  LOOP
    SELECT
      COALESCE(jsonb_agg(id ORDER BY start_time DESC), '[]'::jsonb),
      MIN(start_time)
    INTO qualifying_ids, first_achieved_at
    FROM (
      SELECT id, start_time
      FROM public.activities
      WHERE user_id = NEW.user_id
        AND type = NEW.type
        AND distance >= ms.threshold_distance_mi
      ORDER BY start_time DESC
      LIMIT 3
    ) recent_qualifying;

    INSERT INTO public.skill_milestone_progress (
      user_id,
      milestone_id,
      status,
      progress_current,
      progress_target,
      achieved_at,
      evidence_log_ids,
      updated_at
    ) VALUES (
      NEW.user_id,
      ms.id,
      CASE WHEN jsonb_array_length(qualifying_ids) > 0 THEN 'achieved'::public.milestone_status ELSE 'locked'::public.milestone_status END,
      CASE WHEN jsonb_array_length(qualifying_ids) > 0 THEN 1 ELSE 0 END,
      1,
      first_achieved_at,
      qualifying_ids,
      now()
    )
    ON CONFLICT (user_id, milestone_id) DO UPDATE SET
      status = EXCLUDED.status,
      progress_current = EXCLUDED.progress_current,
      progress_target = EXCLUDED.progress_target,
      achieved_at = COALESCE(public.skill_milestone_progress.achieved_at, EXCLUDED.achieved_at),
      evidence_log_ids = EXCLUDED.evidence_log_ids,
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_single_activity_distance_milestones_after_activity_save ON public.activities;

CREATE TRIGGER refresh_single_activity_distance_milestones_after_activity_save
AFTER INSERT OR UPDATE OF type, distance, start_time ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.refresh_single_activity_distance_milestones();

UPDATE public.activities
SET distance = distance
WHERE id = '5dabbeba-4171-4764-bd4d-d1365caa101e';