import { useMemo } from "react";
import { startOfWeek, subWeeks, startOfMonth, startOfYear, differenceInCalendarDays, addDays, format } from "date-fns";
import { Activity, MILE_ACTIVITIES } from "./useActivities";

export interface WeekData {
  miles: number;
  classes: number;
  outdoor: number;
  water: number;
}

export interface QuarterChallenge {
  label: string;
  current: number;
  target: number;
  pct: number;
  projectedFinish: string | null;
  pace: "ahead" | "on_pace" | "behind";
}

export interface DashboardInsights {
  wtd: WeekData;
  mtd: { miles: number };
  ytd: { miles: number };
  qtd: { miles: number };
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
  quarterWeeklyGoals: {
    kayak: { hit: number; total: number };
    outdoor: { hit: number; total: number };
    classes: { hit: number; total: number };
  };
  kayakChallenge: QuarterChallenge;
  hikingTotal: { miles: number; count: number };
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

function getQuarterStart(date: Date): Date {
  const m = date.getMonth();
  const q = Math.floor(m / 3) * 3;
  return new Date(date.getFullYear(), q, 1);
}

function getQuarterEnd(date: Date): Date {
  const m = date.getMonth();
  const q = Math.floor(m / 3) * 3 + 3;
  return new Date(date.getFullYear(), q, 1);
}

function getQuarterLabel(date: Date): string {
  return `Q${Math.floor(date.getMonth() / 3) + 1}`;
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

    // MTD / YTD / QTD
    const monthStart = startOfMonth(now).getTime();
    const yearStart = startOfYear(now).getTime();
    const qStart = getQuarterStart(now);
    const qEnd = getQuarterEnd(now);
    const qStartMs = qStart.getTime();

    const getMiles = (start: number) =>
      activities
        .filter((a) => new Date(a.start_time).getTime() >= start)
        .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
        .reduce((s, a) => s + (a.distance || 0), 0);

    const qtdMiles = getMiles(qStartMs);

    // Kayak challenge: 90 miles per quarter
    const KAYAK_TARGET = 90;
    const kayakQtd = activities
      .filter((a) => new Date(a.start_time).getTime() >= qStartMs)
      .filter((a) => a.type === "kayaking")
      .reduce((s, a) => s + (a.distance || 0), 0);
    const daysPassed = Math.max(differenceInCalendarDays(now, qStart), 1);
    const totalDays = differenceInCalendarDays(qEnd, qStart);
    const dailyRate = kayakQtd / daysPassed;
    const daysToFinish = dailyRate > 0 ? Math.ceil((KAYAK_TARGET - kayakQtd) / dailyRate) : null;
    const projectedFinish = daysToFinish !== null && daysToFinish > 0 ? format(addDays(now, daysToFinish), "MMM d") : kayakQtd >= KAYAK_TARGET ? "Done!" : null;
    const expectedPct = daysPassed / totalDays;
    const actualPct = kayakQtd / KAYAK_TARGET;
    const pace = actualPct >= expectedPct * 1.05 ? "ahead" as const : actualPct >= expectedPct * 0.85 ? "on_pace" as const : "behind" as const;

    // Hiking totals for quarter
    const hikingLogs = activities.filter((a) => new Date(a.start_time).getTime() >= qStartMs && a.type === "hiking");
    const hikingMiles = hikingLogs.reduce((s, a) => s + (a.distance || 0), 0);

    // Quarter weekly goals: how many weeks in this quarter hit the goal
    const weeksInQuarter = Math.ceil(daysPassed / 7);
    const countWeeksHit = (check: (w: WeekData) => boolean) => {
      let hit = 0;
      for (let i = 0; i < weeksInQuarter; i++) {
        const ws = new Date(qStartMs + i * 7 * 86400000);
        const we = new Date(ws.getTime() + 7 * 86400000);
        const wd = getWeekData(activities, ws.getTime(), Math.min(we.getTime(), now.getTime()));
        if (check(wd)) hit++;
      }
      return hit;
    };

    return {
      wtd,
      mtd: { miles: getMiles(monthStart) },
      ytd: { miles: getMiles(yearStart) },
      qtd: { miles: qtdMiles },
      lastWeek,
      weekDelta: wtd.miles - lastWeek.miles,
      threeWeekAvg,
      streaks,
      goalNotes,
      quarterWeeklyGoals: {
        kayak: { hit: countWeeksHit((w) => w.water >= goals.kayak), total: weeksInQuarter },
        outdoor: { hit: countWeeksHit((w) => w.outdoor >= goals.outdoor), total: weeksInQuarter },
        classes: { hit: countWeeksHit((w) => w.classes >= goals.exercises), total: weeksInQuarter },
      },
      kayakChallenge: {
        label: `${getQuarterLabel(now)} Kayak Challenge`,
        current: kayakQtd,
        target: KAYAK_TARGET,
        pct: Math.min((kayakQtd / KAYAK_TARGET) * 100, 100),
        projectedFinish,
        pace,
      },
      hikingTotal: { miles: hikingMiles, count: hikingLogs.length },
    };
  }, [activities, goals.exercises, goals.outdoor, goals.kayak]);
}
