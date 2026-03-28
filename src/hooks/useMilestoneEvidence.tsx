import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SkillMilestoneProgress } from "./useSkillMilestones";

export interface EvidenceActivity {
  id: string;
  route: string | null;
  distance: number | null;
  elevation_gain: number | null;
  type: string;
  start_time: string;
}

/**
 * Given a list of milestone progress entries, fetches the evidence activities
 * for all achieved milestones in a single query. Returns a map: progressId → activity details.
 */
export function useMilestoneEvidence(progressItems: SkillMilestoneProgress[] | undefined) {
  const achievedWithEvidence = (progressItems ?? []).filter(
    (p) => p.status === "achieved" && p.evidence_log_ids && (p.evidence_log_ids as string[]).length > 0
  );

  const allLogIds = achievedWithEvidence.flatMap((p) => p.evidence_log_ids as string[]);
  const uniqueLogIds = [...new Set(allLogIds)];

  return useQuery({
    queryKey: ["milestone_evidence", uniqueLogIds.sort().join(",")],
    queryFn: async () => {
      if (uniqueLogIds.length === 0) return new Map<string, EvidenceActivity>();

      const { data, error } = await supabase
        .from("activities")
        .select("id, route, distance, elevation_gain, type, start_time")
        .in("id", uniqueLogIds);
      if (error) throw error;

      const activityMap = new Map<string, EvidenceActivity>();
      (data as EvidenceActivity[])?.forEach((a) => activityMap.set(a.id, a));

      // Build a map from progress.id → best evidence activity (first one, typically the qualifying one)
      const resultMap = new Map<string, EvidenceActivity>();
      for (const p of achievedWithEvidence) {
        const logIds = p.evidence_log_ids as string[];
        // Pick the first evidence log that exists
        for (const logId of logIds) {
          const activity = activityMap.get(logId);
          if (activity) {
            resultMap.set(p.id, activity);
            break;
          }
        }
      }
      return resultMap;
    },
    enabled: uniqueLogIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
