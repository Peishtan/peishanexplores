import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Activity {
  id: string;
  user_id: string;
  type: "walk" | "run" | "cycle" | "gym";
  start_time: string;
  duration: number;
  distance: number | null;
  calories: number | null;
  intensity: "low" | "moderate" | "high" | "extreme";
  notes: string | null;
  created_at: string;
}

export function useActivities(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activities", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select("*")
        .eq("user_id", user!.id)
        .order("start_time", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });
}

export function useTodayActivities() {
  const { user } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["activities", "today", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user!.id)
        .gte("start_time", today.toISOString())
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activity: Omit<Activity, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase
        .from("activities")
        .insert({ ...activity, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
