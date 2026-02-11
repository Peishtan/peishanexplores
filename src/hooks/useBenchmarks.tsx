import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const BENCHMARK_TYPES = [
  { id: "500m_row" as const, label: "500m Row", unit: "time" as const },
  { id: "1000m_row" as const, label: "1000m Row", unit: "time" as const },
  { id: "pushups_1m" as const, label: "Push-ups (1 min)", unit: "reps" as const },
  { id: "situps_1m" as const, label: "Sit-ups (1 min)", unit: "reps" as const },
  { id: "plank_time" as const, label: "Plank (Max Time)", unit: "time" as const },
] as const;

export type BenchmarkTypeId = (typeof BENCHMARK_TYPES)[number]["id"];

export interface Benchmark {
  id: string;
  user_id: string;
  test_id: BenchmarkTypeId;
  date: string;
  result: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useBenchmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["benchmarks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benchmarks")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as Benchmark[];
    },
    enabled: !!user,
  });
}

export function useAddBenchmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (benchmark: { test_id: BenchmarkTypeId; date: string; result: string; notes?: string }) => {
      const { error } = await supabase
        .from("benchmarks")
        .insert({ ...benchmark, user_id: user!.id, notes: benchmark.notes || null });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benchmarks"] }),
  });
}

export function useUpdateBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; date?: string; result?: string; notes?: string }) => {
      const { error } = await supabase.from("benchmarks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benchmarks"] }),
  });
}

export function useDeleteBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("benchmarks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benchmarks"] }),
  });
}

export function parseResultToNumber(result: string, unit: "time" | "reps"): number {
  if (unit === "reps") return parseFloat(result) || 0;
  if (!result || typeof result !== "string") return 0;
  if (!result.includes(":")) return parseFloat(result) || 0;
  const parts = result.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(result) || 0;
}

export function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, "0")}`;
}
