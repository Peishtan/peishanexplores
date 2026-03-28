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
 * Given a list of milestone progress entries, fetches evidence activities
 * for all achieved milestones. Returns a map: progressId → array of activities (desc by date).
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
      if (uniqueLogIds.length === 0) return new Map<string, EvidenceActivity[]>();

      const { data, error } = await supabase
        .from("activities")
        .select("id, route, distance, elevation_gain, type, start_time")
        .in("id", uniqueLogIds);
      if (error) throw error;

      const activityMap = new Map<string, EvidenceActivity>();
      (data as EvidenceActivity[])?.forEach((a) => activityMap.set(a.id, a));

      const resultMap = new Map<string, EvidenceActivity[]>();
      for (const p of achievedWithEvidence) {
        const logIds = p.evidence_log_ids as string[];
        const activities = logIds
          .map((id) => activityMap.get(id))
          .filter(Boolean) as EvidenceActivity[];
        // Sort desc by start_time
        activities.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        if (activities.length > 0) {
          resultMap.set(p.id, activities);
        }
      }
      return resultMap;
    },
    enabled: uniqueLogIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
