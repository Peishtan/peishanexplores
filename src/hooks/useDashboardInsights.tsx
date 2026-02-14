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

export interface MomentumData {
  fourWeekAvgMiles: number;
  priorFourWeekAvgMiles: number;
  fourWeekDelta: number;
  elevTrendPct: number; // % change recent 4wk avg vs prior 4wk avg
  longestHikeThisQ: number;
  longestHikeLastQ: number;
}

export interface DashboardInsights {
  wtd: WeekData;
  mtd: { miles: number };
  ytd: { miles: number };
  qtd: { miles: number };
  lastWeek: WeekData;
  weekDelta: number;
  threeWeekAvg: number;
  streaks: { outdoor: number; classes: number; water: number; miles: number };
  quarterWeeklyGoals: {
    kayak: { weekResults: boolean[]; total: number };
    outdoor: { weekResults: boolean[]; total: number };
    classes: { weekResults: boolean[]; total: number };
  };
  kayakChallenge: QuarterChallenge;
  hikingChallenge: QuarterChallenge;
  hikingTotal: { miles: number; count: number; avgElevation: number; maxElevation: number };
  momentum: MomentumData;
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
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
}

function getQuarterEnd(date: Date): Date {
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3 + 3, 1);
}

function getQuarterLabel(date: Date): string {
  return `Q${Math.floor(date.getMonth() / 3) + 1}`;
}

function buildChallenge(
  label: string, current: number, target: number,
  daysPassed: number, totalDays: number, now: Date
): QuarterChallenge {
  const dailyRate = current / Math.max(daysPassed, 1);
  const daysToFinish = dailyRate > 0 ? Math.ceil((target - current) / dailyRate) : null;
  const projectedFinish = daysToFinish !== null && daysToFinish > 0
    ? format(addDays(now, daysToFinish), "MMM d")
    : current >= target ? "Done!" : null;
  const expectedPct = daysPassed / totalDays;
  const actualPct = current / target;
  const pace = actualPct >= expectedPct * 1.05 ? "ahead" as const
    : actualPct >= expectedPct * 0.85 ? "on_pace" as const : "behind" as const;
  return { label, current, target, pct: Math.min((current / target) * 100, 100), projectedFinish, pace };
}

export function useDashboardInsights(
  activities: Activity[] | undefined,
  goals: { exercises: number; outdoor: number; kayak: number; hikingTarget: number; kayakTarget: number }
): DashboardInsights | null {
  return useMemo(() => {
    if (!activities) return null;

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 86400000);
    const lastWeekStart = subWeeks(thisWeekStart, 1);

    const wtd = getWeekData(activities, thisWeekStart.getTime(), thisWeekEnd.getTime());
    const lastWeek = getWeekData(activities, lastWeekStart.getTime(), thisWeekStart.getTime());

    const threeWeeksAgo = subWeeks(thisWeekStart, 3);
    const threeWeekMiles = activities
      .filter((a) => { const t = new Date(a.start_time).getTime(); return t >= threeWeeksAgo.getTime() && t < thisWeekStart.getTime(); })
      .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
      .reduce((s, a) => s + (a.distance || 0), 0);

    const computeStreak = (check: (w: WeekData) => boolean) => {
      let streak = check(wtd) ? 1 : 0;
      for (let i = 1; i <= 52; i++) {
        const ws = subWeeks(thisWeekStart, i);
        const we = subWeeks(thisWeekStart, i - 1);
        if (check(getWeekData(activities, ws.getTime(), we.getTime()))) streak++;
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

    const monthStart = startOfMonth(now).getTime();
    const yearStart = startOfYear(now).getTime();
    const qStart = getQuarterStart(now);
    const qEnd = getQuarterEnd(now);
    const qStartMs = qStart.getTime();
    const daysPassed = Math.max(differenceInCalendarDays(now, qStart), 1);
    const totalDays = differenceInCalendarDays(qEnd, qStart);

    const getMiles = (start: number) =>
      activities.filter((a) => new Date(a.start_time).getTime() >= start)
        .filter((a) => MILE_ACTIVITIES.includes(a.type as any))
        .reduce((s, a) => s + (a.distance || 0), 0);

    const qtdMiles = getMiles(qStartMs);

    // Kayak challenge
    const kayakQtd = activities.filter((a) => new Date(a.start_time).getTime() >= qStartMs && a.type === "kayaking")
      .reduce((s, a) => s + (a.distance || 0), 0);
    const kayakChallenge = buildChallenge(`${getQuarterLabel(now)} Kayak Challenge`, kayakQtd, goals.kayakTarget, daysPassed, totalDays, now);

    // Hiking challenge + totals
    const hikingLogs = activities.filter((a) => new Date(a.start_time).getTime() >= qStartMs && (a.type === "hiking" || a.type === "xc_skiing"));
    const hikingMiles = hikingLogs.reduce((s, a) => s + (a.distance || 0), 0);
    const hikingChallenge = buildChallenge(`${getQuarterLabel(now)} Hiking / XC Ski Challenge`, hikingMiles, goals.hikingTarget, daysPassed, totalDays, now);

    const hikingWithElev = hikingLogs.filter((a) => a.elevation_gain != null && a.elevation_gain > 0);
    const avgElevation = hikingWithElev.length > 0
      ? hikingWithElev.reduce((s, a) => s + (a.elevation_gain || 0), 0) / hikingWithElev.length : 0;
    const maxElevation = hikingWithElev.length > 0
      ? Math.max(...hikingWithElev.map((a) => a.elevation_gain || 0)) : 0;

    // Quarter weekly goals
    // Use Monday-aligned weeks for quarter goal tracking
    const firstMonday = startOfWeek(qStart, { weekStartsOn: 1 });
    const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
    const weeksInQuarter = Math.floor((currentMonday.getTime() - firstMonday.getTime()) / (7 * 86400000)) + 1;
    const getWeekResults = (check: (w: WeekData) => boolean): boolean[] => {
      const results: boolean[] = [];
      for (let i = 0; i < weeksInQuarter; i++) {
        const ws = new Date(firstMonday.getTime() + i * 7 * 86400000);
        const we = new Date(ws.getTime() + 7 * 86400000);
        const effectiveStart = Math.max(ws.getTime(), qStartMs);
        results.push(check(getWeekData(activities, effectiveStart, Math.min(we.getTime(), now.getTime()))));
      }
      return results;
    };

    // Momentum computations
    const fourWeeksAgo = subWeeks(thisWeekStart, 4).getTime();
    const eightWeeksAgo = subWeeks(thisWeekStart, 8).getTime();

    const milesInRange = (start: number, end: number) =>
      activities.filter(a => { const t = new Date(a.start_time).getTime(); return t >= start && t < end; })
        .filter(a => MILE_ACTIVITIES.includes(a.type as any))
        .reduce((s, a) => s + (a.distance || 0), 0);

    const recent4Miles = milesInRange(fourWeeksAgo, thisWeekStart.getTime());
    const prior4Miles = milesInRange(eightWeeksAgo, fourWeeksAgo);
    const fourWeekAvgMiles = recent4Miles / 4;
    const priorFourWeekAvgMiles = prior4Miles / 4;

    const elevInRange = (start: number, end: number) => {
      const logs = activities.filter(a => { const t = new Date(a.start_time).getTime(); return t >= start && t < end && (a.elevation_gain ?? 0) > 0; });
      return logs.length > 0 ? logs.reduce((s, a) => s + (a.elevation_gain ?? 0), 0) / logs.length : 0;
    };
    const recentElev = elevInRange(fourWeeksAgo, thisWeekStart.getTime());
    const priorElev = elevInRange(eightWeeksAgo, fourWeeksAgo);
    const elevTrendPct = priorElev > 0 ? ((recentElev - priorElev) / priorElev) * 100 : 0;

    // Longest hike this Q vs last Q
    const hikingDistancesThisQ = activities
      .filter(a => new Date(a.start_time).getTime() >= qStartMs && ["hiking", "xc_skiing"].includes(a.type) && a.distance)
      .map(a => a.distance!);
    const longestHikeThisQ = hikingDistancesThisQ.length > 0 ? Math.max(...hikingDistancesThisQ) : 0;

    const lastQStart = new Date(qStart.getFullYear(), qStart.getMonth() - 3, 1);
    const lastQEnd = qStart;
    const hikingDistancesLastQ = activities
      .filter(a => { const t = new Date(a.start_time); return t >= lastQStart && t < lastQEnd && ["hiking", "xc_skiing"].includes(a.type) && a.distance; })
      .map(a => a.distance!);
    const longestHikeLastQ = hikingDistancesLastQ.length > 0 ? Math.max(...hikingDistancesLastQ) : 0;

    const momentum: MomentumData = {
      fourWeekAvgMiles,
      priorFourWeekAvgMiles,
      fourWeekDelta: fourWeekAvgMiles - priorFourWeekAvgMiles,
      elevTrendPct: Math.round(elevTrendPct),
      longestHikeThisQ,
      longestHikeLastQ,
    };

    return {
      wtd, mtd: { miles: getMiles(monthStart) }, ytd: { miles: getMiles(yearStart) }, qtd: { miles: qtdMiles },
      lastWeek, weekDelta: wtd.miles - lastWeek.miles, threeWeekAvg: threeWeekMiles / 3, streaks,
      quarterWeeklyGoals: {
        kayak: { weekResults: getWeekResults((w) => w.water >= goals.kayak), total: weeksInQuarter },
        outdoor: { weekResults: getWeekResults((w) => w.outdoor >= goals.outdoor), total: weeksInQuarter },
        classes: { weekResults: getWeekResults((w) => w.classes >= goals.exercises), total: weeksInQuarter },
      },
      kayakChallenge, hikingChallenge,
      hikingTotal: { miles: hikingMiles, count: hikingLogs.length, avgElevation: Math.round(avgElevation), maxElevation },
      momentum,
    };
  }, [activities, goals.exercises, goals.outdoor, goals.kayak, goals.hikingTarget, goals.kayakTarget]);
}
