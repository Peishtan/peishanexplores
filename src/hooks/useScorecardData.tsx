import { useMemo } from "react";
import { startOfWeek, addWeeks } from "date-fns";
import { Activity, MILE_ACTIVITIES } from "./useActivities";
import { SkillMilestoneProgress } from "./useSkillMilestones";
import { Profile } from "./useProfile";

export interface QuarterInfo {
  label: string;
  year: number;
  qNum: number;
  start: Date;
  end: Date;
  isCurrent: boolean;
}

export interface TargetResult {
  label: string;
  current: number;
  target: number;
  unit: string;
  hit: boolean;
}

export interface ConsistencyResult {
  label: string;
  weeksHit: number;
  totalWeeks: number;
  pct: number;
}

export interface Highlight {
  icon: string;
  label: string;
  value: string;
}

export interface Insight {
  type: "strength" | "gap";
  text: string;
}

export interface ScorecardData {
  quarter: QuarterInfo;
  targets: TargetResult[];
  consistency: ConsistencyResult[];
  overallConsistency: number;
  highlights: Highlight[];
  insights: Insight[];
  totalActivities: number;
  totalMiles: number;
  totalElevation: number;
  milestonesUnlocked: number;
  milestonesAchievedTotal: number;
  totalMilestones: number;
}

function getQuarterStart(year: number, q: number): Date {
  return new Date(year, (q - 1) * 3, 1);
}

function getQuarterEnd(year: number, q: number): Date {
  return new Date(year, q * 3, 1);
}

export function getAvailableQuarters(activities: Activity[]): QuarterInfo[] {
  const now = new Date();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();

  const quarters: QuarterInfo[] = [];
  const seen = new Set<string>();

  // Always include current quarter
  const key = `${currentYear}-Q${currentQ}`;
  seen.add(key);
  quarters.push({
    label: `Q${currentQ} ${currentYear}`,
    year: currentYear,
    qNum: currentQ,
    start: getQuarterStart(currentYear, currentQ),
    end: getQuarterEnd(currentYear, currentQ),
    isCurrent: true,
  });

  // Add quarters from activities
  for (const a of activities) {
    const d = new Date(a.start_time);
    const y = d.getFullYear();
    const q = Math.floor(d.getMonth() / 3) + 1;
    const k = `${y}-Q${q}`;
    if (!seen.has(k)) {
      seen.add(k);
      quarters.push({
        label: `Q${q} ${y}`,
        year: y,
        qNum: q,
        start: getQuarterStart(y, q),
        end: getQuarterEnd(y, q),
        isCurrent: y === currentYear && q === currentQ,
      });
    }
  }

  // Sort descending (most recent first)
  quarters.sort((a, b) => b.start.getTime() - a.start.getTime());
  return quarters;
}

function getWeekData(activities: Activity[], weekStart: number, weekEnd: number) {
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

export function computeScorecard(
  quarter: QuarterInfo,
  activities: Activity[],
  profile: Profile,
  milestones: SkillMilestoneProgress[],
  totalMilestoneCount: number
): ScorecardData {
  const qStartMs = quarter.start.getTime();
  const qEndMs = quarter.end.getTime();
  const now = new Date();
  const effectiveEnd = quarter.isCurrent ? now : quarter.end;

  // Filter activities for this quarter
  const qActivities = activities.filter((a) => {
    const t = new Date(a.start_time).getTime();
    return t >= qStartMs && t < qEndMs;
  });

  // ── Targets ──
  const hikingLogs = qActivities.filter((a) => a.type === "hiking" || a.type === "xc_skiing");
  const kayakLogs = qActivities.filter((a) => a.type === "kayaking");
  const hikingMiles = hikingLogs.reduce((s, a) => s + (a.distance || 0), 0);
  const kayakMiles = kayakLogs.reduce((s, a) => s + (a.distance || 0), 0);

  const targets: TargetResult[] = [
    { label: "Hiking / XC Ski Miles", current: Math.round(hikingMiles * 10) / 10, target: profile.goal_hiking_quarterly_miles, unit: "mi", hit: hikingMiles >= profile.goal_hiking_quarterly_miles },
    { label: "Kayak Miles", current: Math.round(kayakMiles * 10) / 10, target: profile.goal_kayak_quarterly_miles, unit: "mi", hit: kayakMiles >= profile.goal_kayak_quarterly_miles },
  ];

  // ── Consistency (weekly goals) ──
  const firstMonday = startOfWeek(quarter.start, { weekStartsOn: 1 });
  const totalQuarterWeeks = 13;
  const weeksInQuarter = totalQuarterWeeks;

  const checkWeeks = (check: (w: ReturnType<typeof getWeekData>) => boolean) => {
    let hit = 0;
    for (let i = 0; i < weeksInQuarter; i++) {
      const ws = addWeeks(firstMonday, i);
      const we = addWeeks(firstMonday, i + 1);
      const effectiveStart = Math.max(ws.getTime(), qStartMs);
      if (check(getWeekData(activities, effectiveStart, we.getTime()))) hit++;
    }
    return hit;
  };

  const gymHit = checkWeeks((w) => w.classes >= (profile.goal_exercises_per_week ?? 3));
  const outdoorHit = checkWeeks((w) => w.outdoor >= (profile.goal_outdoor_per_week ?? 1));
  const kayakHit = checkWeeks((w) => w.water >= (profile.goal_kayak_per_week ?? 1));

  const consistency: ConsistencyResult[] = [
    { label: "Gym Sessions", weeksHit: gymHit, totalWeeks: weeksInQuarter, pct: Math.round((gymHit / weeksInQuarter) * 100) },
    { label: "Outdoor Sessions", weeksHit: outdoorHit, totalWeeks: weeksInQuarter, pct: Math.round((outdoorHit / weeksInQuarter) * 100) },
    { label: "Kayak Sessions", weeksHit: kayakHit, totalWeeks: weeksInQuarter, pct: Math.round((kayakHit / weeksInQuarter) * 100) },
  ];

  const overallConsistency = Math.round(consistency.reduce((s, c) => s + c.pct, 0) / consistency.length);

  // ── Highlights ──
  const totalMiles = qActivities.filter((a) => MILE_ACTIVITIES.includes(a.type as any)).reduce((s, a) => s + (a.distance || 0), 0);
  const totalElevation = qActivities.reduce((s, a) => s + (a.elevation_gain || 0), 0);
  const longestHike = hikingLogs.length > 0 ? Math.max(...hikingLogs.map((a) => a.distance || 0)) : 0;
  const longestKayak = kayakLogs.length > 0 ? Math.max(...kayakLogs.map((a) => a.distance || 0)) : 0;
  const highestElevation = hikingLogs.length > 0 ? Math.max(...hikingLogs.map((a) => a.elevation_gain || 0)) : 0;
  const xcSkiLogs = qActivities.filter((a) => a.type === "xc_skiing");
  const longestXcSki = xcSkiLogs.length > 0 ? Math.max(...xcSkiLogs.map((a) => a.distance || 0)) : 0;

  // Milestones achieved this quarter
  const qMilestones = milestones.filter(
    (m) => m.status === "achieved" && m.achieved_at && new Date(m.achieved_at).getTime() >= qStartMs && new Date(m.achieved_at).getTime() < qEndMs
  );

  const highlights: Highlight[] = [];
  if (qMilestones.length > 0) {
    highlights.push({ icon: "medal", label: "Milestones Unlocked", value: qMilestones.length.toString() });
  }
  if (longestHike > 0) {
    highlights.push({ icon: "footprints", label: "Longest Hike", value: `${Math.round(longestHike * 10) / 10} mi` });
  }
  if (longestKayak > 0) {
    highlights.push({ icon: "waves", label: "Longest Paddle", value: `${Math.round(longestKayak * 10) / 10} mi` });
  }
  if (highestElevation > 0) {
    highlights.push({ icon: "mountain", label: "Peak Elevation Gain", value: `${highestElevation.toLocaleString()} ft` });
  }
  if (longestXcSki > 0) {
    highlights.push({ icon: "snowflake", label: "Longest XC Ski", value: `${Math.round(longestXcSki * 10) / 10} mi` });
  }

  // ── Strengths & Gaps ──
  const insights: Insight[] = [];

  // Strengths
  if (targets.filter((t) => t.hit).length === targets.length && targets.length > 0) {
    insights.push({ type: "strength", text: "All quarterly distance targets achieved — outstanding commitment!" });
  } else {
    targets.filter((t) => t.hit).forEach((t) => {
      insights.push({ type: "strength", text: `${t.label} target smashed (${t.current}/${t.target} ${t.unit})` });
    });
  }

  consistency.filter((c) => c.pct >= 80).forEach((c) => {
    insights.push({ type: "strength", text: `Strong ${c.label.toLowerCase()} consistency at ${c.pct}%` });
  });

  if (qMilestones.length >= 3) {
    insights.push({ type: "strength", text: `Unlocked ${qMilestones.length} milestones — big progression quarter` });
  }

  if (longestHike > 10) {
    insights.push({ type: "strength", text: `Logged a ${Math.round(longestHike * 10) / 10}-mile hike — endurance building` });
  }

  // Gaps
  targets.filter((t) => !t.hit).forEach((t) => {
    const pct = Math.round((t.current / t.target) * 100);
    insights.push({ type: "gap", text: `${t.label}: reached ${pct}% of target (${t.current}/${t.target} ${t.unit})` });
  });

  consistency.filter((c) => c.pct < 60).forEach((c) => {
    insights.push({ type: "gap", text: `${c.label} consistency was ${c.pct}% — room to build a steadier rhythm` });
  });

  if (qActivities.length === 0) {
    insights.push({ type: "gap", text: "No activities logged this quarter yet — time to get moving!" });
  }

  return {
    quarter,
    targets,
    consistency,
    overallConsistency,
    highlights,
    insights,
    totalActivities: qActivities.length,
    totalMiles: Math.round(totalMiles * 10) / 10,
    totalElevation: Math.round(totalElevation),
    milestonesUnlocked: qMilestones.length,
    milestonesAchievedTotal: milestones.filter((m) => m.status === "achieved").length,
    totalMilestones: totalMilestoneCount,
  };
}
