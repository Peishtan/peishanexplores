import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
}

export function useWeightEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weight_entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as WeightEntry[];
    },
    enabled: !!user,
  });
}

export function useAddWeightEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: { date: string; weight: number }) => {
      const { error } = await supabase
        .from("weight_entries")
        .insert({ ...entry, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight_entries"] });
    },
  });
}

export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight_entries"] });
    },
  });
}
