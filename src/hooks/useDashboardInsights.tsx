import { useMemo } from "react";
import { startOfWeek, subWeeks, startOfMonth, startOfYear, differenceInWeeks } from "date-fns";
import { Activity, MILE_ACTIVITIES } from "./useActivities";

export interface WeekData {
  miles: number;
  classes: number;
  outdoor: number;
  water: number;
}

export interface DashboardInsights {
  wtd: WeekData;
  mtd: { miles: number };
  ytd: { miles: number };
  lastWeek: WeekData;
  weekDelta: number;
  threeWeekAvg: number;
  streaks: {
    outdoor: number;
    classes: number;
    water: number;
    miles: number;
  };
  goalNotes: {
    classes: string;
    outdoor: string;
    water: string;
  };
  load: {
    last7: number;
    last30: number;
    trend: "increasing" | "decreasing" | "stable";
    risk: "low" | "moderate" | "high";
  };
  breakdowns: {
    wtd: { data: { name: string; miles: number; color: string }[]; total: number };
    mtd: { data: { name: string; miles: number; color: string }[]; total: number };
    ytd: { data: { name: string; miles: number; color: string }[]; total: number };
  };
}

function getWeekData(activities: Activity[], weekStart: number, weekEnd: number): WeekData {
  const logs = activities.filter((a) => {
    const t = new Date(a.start_time).getTime();
    return t >= weekStart && t < weekEnd;
  });
  return {
    miles: logs.filter((a) => MILE_ACTIVITIES.includes(a.type as any)).reduce((s, a) => s + (a.distance || 0), 0),
    classes: logs.filter((a) => ["peloton", "orange_theory"].includes(a.type)).length,
    outdoor: logs.filter((a) => ["hiking", "xc_skiing"].includes(a.type)).length,
    water: logs.filter((a) => a.type === "kayaking").length,
  };
}

function getBreakdown(activities: Activity[], start: number) {
  const logs = activities.filter((a) => new Date(a.start_time).getTime() >= start);
  const k = logs.filter((a) => a.type === "kayaking").reduce((s, a) => s + (a.distance || 0), 0);
  const h = logs.filter((a) => a.type === "hiking").reduce((s, a) => s + (a.distance || 0), 0);
  const x = logs.filter((a) => a.type === "xc_skiing").reduce((s, a) => s + (a.distance || 0), 0);
  return {
    data: [
      { name: "Kayaking", miles: k, color: "#0ea5e9" },
      { name: "XC Skiing", miles: x, color: "#6366f1" },
      { name: "Hiking", miles: h, color: "#22c55e" },
    ],
    total: k + h + x,
  };
}

export function useDashboardInsights(
  activities: Activity[] | undefined,
  goals: { exercises: number; outdoor: number; kayak: number }
): DashboardInsights | null {
  return useMemo(() => {
    if (!activities) return null;

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 86400000);
    const lastWeekStart = subWeeks(thisWeekStart, 1);

    const wtd = getWeekData(activities, thisWeekStart.getTime(), thisWeekEnd.getTime());
    const lastWeek = getWeekData(activities, lastWeekStart.getTime(), thisWeekStart.getTime());

    // 3-week rolling average
    const threeWeeksAgo = subWeeks(thisWeekStart, 3);
    const threeWeekMiles = activities
      .filter((a) => {
        const t = new Date(a.start_time).getTime();
        return t >= threeWeeksAgo.getTime() && t < thisWeekStart.getTime();
      })
      .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
      .reduce((s, a) => s + (a.distance || 0), 0);
    const threeWeekAvg = threeWeekMiles / 3;

    // Streak calculation (how many consecutive past weeks met goal)
    const computeStreak = (check: (w: WeekData) => boolean) => {
      let streak = 0;
      // Check if current week meets goal too
      if (check(wtd)) streak++;
      for (let i = 1; i <= 52; i++) {
        const ws = subWeeks(thisWeekStart, i);
        const we = subWeeks(thisWeekStart, i - 1);
        const wd = getWeekData(activities, ws.getTime(), we.getTime());
        if (check(wd)) streak++;
        else break;
      }
      return streak;
    };

    const streaks = {
      outdoor: computeStreak((w) => w.outdoor >= goals.outdoor),
      classes: computeStreak((w) => w.classes >= goals.exercises),
      water: computeStreak((w) => w.water >= goals.kayak),
      miles: computeStreak((w) => w.miles > 0),
    };

    // Contextual goal notes
    const goalNote = (current: number, goal: number, lastVal: number, label: string): string => {
      if (current >= goal) {
        if (lastVal < goal) return "Back on track!";
        if (current > lastVal) return "Trending up";
        if (current < lastVal) return "Down from last week";
        return "Consistent";
      }
      const remaining = goal - current;
      return `${remaining} more to go`;
    };

    const goalNotes = {
      classes: goalNote(wtd.classes, goals.exercises, lastWeek.classes, "classes"),
      outdoor: goalNote(wtd.outdoor, goals.outdoor, lastWeek.outdoor, "outdoor"),
      water: goalNote(wtd.water, goals.kayak, lastWeek.water, "kayak"),
    };

    // Training load
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const last7 = activities
      .filter((a) => new Date(a.start_time).getTime() >= sevenDaysAgo.getTime())
      .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
      .reduce((s, a) => s + (a.distance || 0), 0);
    const last30 = activities
      .filter((a) => new Date(a.start_time).getTime() >= thirtyDaysAgo.getTime())
      .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
      .reduce((s, a) => s + (a.distance || 0), 0);

    const weeklyAvg30 = last30 / 4;
    const loadRatio = weeklyAvg30 > 0 ? last7 / weeklyAvg30 : 1;
    const trend = loadRatio > 1.15 ? "increasing" as const : loadRatio < 0.85 ? "decreasing" as const : "stable" as const;
    const risk = loadRatio > 1.5 ? "high" as const : loadRatio > 1.2 ? "moderate" as const : "low" as const;

    // MTD / YTD
    const monthStart = startOfMonth(now).getTime();
    const yearStart = startOfYear(now).getTime();
    const getMiles = (start: number) =>
      activities
        .filter((a) => new Date(a.start_time).getTime() >= start)
        .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
        .reduce((s, a) => s + (a.distance || 0), 0);

    return {
      wtd,
      mtd: { miles: getMiles(monthStart) },
      ytd: { miles: getMiles(yearStart) },
      lastWeek,
      weekDelta: wtd.miles - lastWeek.miles,
      threeWeekAvg,
      streaks,
      goalNotes,
      load: { last7, last30, trend, risk },
      breakdowns: {
        wtd: getBreakdown(activities, startOfWeek(now, { weekStartsOn: 1 }).getTime()),
        mtd: getBreakdown(activities, monthStart),
        ytd: getBreakdown(activities, yearStart),
      },
    };
  }, [activities, goals.exercises, goals.outdoor, goals.kayak]);
}
