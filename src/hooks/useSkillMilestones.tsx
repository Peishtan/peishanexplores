import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SkillMilestone {
  id: string;
  title: string;
  milestone_type: string;
  activity_type: string | null;
  threshold_count: number | null;
  threshold_distance_mi: number | null;
  threshold_elevation_ft: number | null;
  threshold_duration_min: number | null;
  window_type: string;
  window_days: number | null;
  is_active: boolean;
}

export interface SkillMilestoneProgress {
  id: string;
  user_id: string;
  milestone_id: string;
  status: "locked" | "in_progress" | "achieved";
  progress_current: number;
  progress_target: number;
  achieved_at: string | null;
  evidence_log_ids: string[];
  updated_at: string;
  // joined
  skill_milestones?: SkillMilestone;
}

export function useSkillMilestoneProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["skill_milestone_progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_milestone_progress")
        .select("*, skill_milestones(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as SkillMilestoneProgress[];
    },
    enabled: !!user,
  });
}

export function useSkillMilestones() {
  return useQuery({
    queryKey: ["skill_milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_milestones")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as SkillMilestone[];
    },
  });
}

export function useRecomputeMilestones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("recompute-milestones", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill_milestone_progress"] });
    },
  });
}

export function useAchievedMilestones(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["skill_milestone_progress", "achieved", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_milestone_progress")
        .select("*, skill_milestones!inner(*)")
        .eq("user_id", user!.id)
        .eq("status", "achieved")
        .eq("skill_milestones.is_active", true)
        .order("achieved_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as SkillMilestoneProgress[];
    },
    enabled: !!user,
  });
}
