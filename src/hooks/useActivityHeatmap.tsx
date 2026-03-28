import { useMemo } from "react";
import { startOfWeek, addWeeks, startOfDay, eachDayOfInterval, format } from "date-fns";
import { Activity } from "@/hooks/useActivities";

export interface HeatmapDay {
  date: Date;
  count: number;
  types: string[];
}

export interface HeatmapWeek {
  weekNum: number;
  days: HeatmapDay[];
}

const SPORT_COLORS: Record<string, string> = {
  kayaking: "rgba(100,160,210,0.8)",
  hiking: "rgba(122,184,124,0.8)",
  xc_skiing: "rgba(180,180,220,0.8)",
  orange_theory: "rgba(212,150,58,0.8)",
  peloton: "rgba(212,150,58,0.8)",
  mixed: "rgba(200,200,200,0.7)",
};

export function getSportColor(types: string[]): string {
  if (types.length === 0) return "transparent";
  if (types.length === 1) return SPORT_COLORS[types[0]] ?? SPORT_COLORS.mixed;
  // Multiple sports on same day
  const unique = [...new Set(types)];
  if (unique.length === 1) return SPORT_COLORS[unique[0]] ?? SPORT_COLORS.mixed;
  return SPORT_COLORS.mixed;
}

export function useActivityHeatmap(activities: Activity[] | undefined, rangeDays?: number) {
  return useMemo(() => {
    if (!activities) return { weeks: [], dayCounts: new Map<string, HeatmapDay>() };

    const now = new Date();
    // Cap at 90 days max for readable cell sizes
    const effectiveDays = Math.min(rangeDays ?? 90, 90);
    const rangeStart = new Date(now.getTime() - effectiveDays * 86400000);
    const firstMonday = startOfWeek(rangeStart, { weekStartsOn: 1 });

    const dayCounts = new Map<string, HeatmapDay>();

    // Initialize all days in range
    const allDays = eachDayOfInterval({ start: firstMonday, end: now });
    allDays.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      dayCounts.set(key, { date: d, count: 0, types: [] });
    });

    // Fill with activity data
    activities.forEach((a) => {
      const d = startOfDay(new Date(a.start_time));
      const key = format(d, "yyyy-MM-dd");
      const existing = dayCounts.get(key);
      if (existing) {
        existing.count++;
        existing.types.push(a.type);
      }
    });

    // Group into weeks
    const weeks: HeatmapWeek[] = [];
    let weekStart = firstMonday;
    let weekNum = 1;
    while (weekStart <= (qEnd > now ? now : qEnd)) {
      const weekEnd = addWeeks(weekStart, 1);
      const days: HeatmapDay[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        if (day > now) break;
        const key = format(day, "yyyy-MM-dd");
        days.push(dayCounts.get(key) ?? { date: day, count: 0, types: [] });
      }
      if (days.length > 0) {
        weeks.push({ weekNum, days });
      }
      weekStart = weekEnd;
      weekNum++;
    }

    return { weeks, dayCounts };
  }, [activities]);
}