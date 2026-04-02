import { useMemo } from "react";
import { startOfWeek, addWeeks } from "date-fns";
import { Activity, MILE_ACTIVITIES } from "./useActivities";
import { SkillMilestoneProgress } from "./useSkillMilestones";

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

export interface SportBreakdown {
  type: string;
  label: string;
  count: number;
  color: string;
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
  sportBreakdown: SportBreakdown[];
  _avgElevation: number;
  _elevationTarget: number;
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

export interface GoalSet {
  goal_hiking_quarterly_miles: number;
  goal_kayak_quarterly_miles: number;
  goal_elevation_avg: number;
  goal_exercises_per_week: number;
  goal_outdoor_per_week: number;
  goal_kayak_per_week: number;
}

export function computeScorecard(
  quarter: QuarterInfo,
  activities: Activity[],
  goals: GoalSet,
  milestones: SkillMilestoneProgress[],
  totalMilestoneCount: number
): ScorecardData {
  const qStartMs = quarter.start.getTime();
  const qEndMs = quarter.end.getTime();

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
    { label: "Hiking / XC Ski Miles", current: Math.round(hikingMiles * 10) / 10, target: goals.goal_hiking_quarterly_miles, unit: "mi", hit: hikingMiles >= goals.goal_hiking_quarterly_miles },
    { label: "Paddle Miles", current: Math.round(kayakMiles * 10) / 10, target: goals.goal_kayak_quarterly_miles, unit: "mi", hit: kayakMiles >= goals.goal_kayak_quarterly_miles },
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
      // Use full week boundaries for consistency (don't clip to quarter start)
      // so partial first weeks still count if the weekly goal is met
      if (check(getWeekData(activities, ws.getTime(), we.getTime()))) hit++;
    }
    return hit;
  };

  const gymHit = checkWeeks((w) => w.classes >= (goals.goal_exercises_per_week ?? 3));
  const outdoorHit = checkWeeks((w) => w.outdoor >= (goals.goal_outdoor_per_week ?? 1));
  const kayakHit = checkWeeks((w) => w.water >= (goals.goal_kayak_per_week ?? 1));

  const consistency: ConsistencyResult[] = [
    { label: "Gym Sessions", weeksHit: gymHit, totalWeeks: weeksInQuarter, pct: Math.round((gymHit / weeksInQuarter) * 100) },
    { label: "Hike / XC Ski Sessions", weeksHit: outdoorHit, totalWeeks: weeksInQuarter, pct: Math.round((outdoorHit / weeksInQuarter) * 100) },
    { label: "Paddle Sessions", weeksHit: kayakHit, totalWeeks: weeksInQuarter, pct: Math.round((kayakHit / weeksInQuarter) * 100) },
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

  // Milestones with qualifying activity in this quarter
  // A milestone counts for a quarter if any of its evidence activities fall within the quarter,
  // OR if achieved_at is within the quarter (for milestones without evidence logs)
  const qMilestones = milestones.filter((m) => {
    if (m.status !== "achieved") return false;
    // Check if any evidence activity falls in this quarter
    const evidenceIds = (m.evidence_log_ids as string[]) ?? [];
    const hasEvidenceInQuarter = evidenceIds.some((logId) => {
      const activity = qActivities.find((a) => a.id === logId);
      return !!activity;
    });
    if (hasEvidenceInQuarter) return true;
    // Fallback: check achieved_at
    if (m.achieved_at) {
      const achievedMs = new Date(m.achieved_at).getTime();
      return achievedMs >= qStartMs && achievedMs < qEndMs;
    }
    return false;
  });

  const highlights: Highlight[] = [];
  if (longestHike > 0) {
    highlights.push({ icon: "footprints", label: "Longest Hike", value: `${Math.round(longestHike * 10) / 10} mi` });
  }
  if (longestKayak > 0) {
    highlights.push({ icon: "waves", label: "Longest Paddle", value: `${Math.round(longestKayak * 10) / 10} mi` });
  }
  if (longestXcSki > 0) {
    highlights.push({ icon: "snowflake", label: "Longest XC Ski", value: `${Math.round(longestXcSki * 10) / 10} mi` });
  }
  if (highestElevation > 0) {
    highlights.push({ icon: "mountain", label: "Peak Elevation Gain", value: `${highestElevation.toLocaleString()} ft` });
  }
  if (qMilestones.length > 0) {
    highlights.push({ icon: "medal", label: "Milestones Unlocked", value: qMilestones.length.toString() });
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

  // Elevation landmark comparison
  if (totalElevation > 0) {
    const landmarks = [
      { name: "Mt. Rainier", ft: 14411 },
      { name: "Mt. Hood", ft: 11249 },
      { name: "Mt. Adams", ft: 12281 },
      { name: "Mt. Baker", ft: 10781 },
      { name: "Mt. St. Helens", ft: 8363 },
      { name: "Mt. Olympus", ft: 7980 },
      { name: "Everest Base Camp", ft: 17598 },
      { name: "Mt. Kilimanjaro", ft: 19341 },
      { name: "Denali", ft: 20310 },
      { name: "Everest", ft: 29032 },
    ];
    // Find highest landmark climbed past
    const passed = landmarks.filter(l => totalElevation >= l.ft).sort((a, b) => b.ft - a.ft);
    const next = landmarks.filter(l => totalElevation < l.ft).sort((a, b) => a.ft - b.ft);

    if (passed.length > 0) {
      const top = passed[0];
      const timesOver = (totalElevation / top.ft).toFixed(1);
      const overBy = totalElevation - top.ft;
      if (next.length > 0) {
        const gap = next[0].ft - totalElevation;
        insights.push({ type: "strength", text: `${totalElevation.toLocaleString()} ft climbed — you've summited ${top.name} (${top.ft.toLocaleString()} ft)! Only ${gap.toLocaleString()} ft to reach ${next[0].name}.` });
      } else {
        insights.push({ type: "strength", text: `${totalElevation.toLocaleString()} ft climbed — that's ${timesOver}× ${top.name}. Legendary.` });
      }
    } else if (next.length > 0) {
      const gap = next[0].ft - totalElevation;
      insights.push({ type: "strength", text: `${totalElevation.toLocaleString()} ft climbed so far — ${gap.toLocaleString()} ft to reach the height of ${next[0].name} (${next[0].ft.toLocaleString()} ft).` });
    }
  }

  // ── Cross-category trade-off analysis ──
  // For each week, compute which categories had overflow (sessions > goal)
  const weeklyOverflows: { gym: number; outdoor: number; water: number }[] = [];
  const weeklyMisses: { gym: boolean; outdoor: boolean; water: boolean }[] = [];
  for (let i = 0; i < weeksInQuarter; i++) {
    const ws = addWeeks(firstMonday, i);
    const we = addWeeks(firstMonday, i + 1);
    // Use full week boundaries (consistent with checkWeeks above)
    const wd = getWeekData(activities, ws.getTime(), we.getTime());
    weeklyOverflows.push({
      gym: Math.max(0, wd.classes - (goals.goal_exercises_per_week ?? 3)),
      outdoor: Math.max(0, wd.outdoor - (goals.goal_outdoor_per_week ?? 1)),
      water: Math.max(0, wd.water - (goals.goal_kayak_per_week ?? 1)),
    });
    weeklyMisses.push({
      gym: wd.classes < (goals.goal_exercises_per_week ?? 3),
      outdoor: wd.outdoor < (goals.goal_outdoor_per_week ?? 1),
      water: wd.water < (goals.goal_kayak_per_week ?? 1),
    });
  }

  // Count weeks where gym was missed but outdoor/water had overflow
  const gymMissedWithOutdoorOverflow = weeklyMisses.filter(
    (m, i) => m.gym && (weeklyOverflows[i].outdoor > 0 || weeklyOverflows[i].water > 0)
  ).length;
  const totalGymMisses = weeklyMisses.filter((m) => m.gym).length;

  const outdoorMissedWithGymOverflow = weeklyMisses.filter(
    (m, i) => (m.outdoor || m.water) && weeklyOverflows[i].gym > 0
  ).length;

  // Gaps — with trade-off awareness
  targets.filter((t) => !t.hit).forEach((t) => {
    const pct = Math.round((t.current / t.target) * 100);
    insights.push({ type: "gap", text: `${t.label}: reached ${pct}% of target (${t.current}/${t.target} ${t.unit})` });
  });

  // Gym consistency gap — check for outdoor trade-off
  const gymCons = consistency.find((c) => c.label === "Gym Sessions");
  const outdoorCons = consistency.find((c) => c.label.includes("Hike"));
  const paddleCons = consistency.find((c) => c.label.includes("Paddle"));

  if (gymCons && gymCons.pct < 60) {
    if (gymMissedWithOutdoorOverflow > 0 && totalGymMisses > 0) {
      const tradeoffPct = Math.round((gymMissedWithOutdoorOverflow / totalGymMisses) * 100);
      if (tradeoffPct >= 40) {
        insights.push({
          type: "gap",
          text: `Gym consistency at ${gymCons.pct}% — but ${gymMissedWithOutdoorOverflow} of ${totalGymMisses} missed weeks coincided with extra outdoor sessions. High-volume adventure weeks are the main trade-off, not lack of effort.`,
        });
      } else {
        insights.push({
          type: "gap",
          text: `Gym consistency was ${gymCons.pct}% — some missed weeks overlapped with big outdoor efforts, but there's room to build a steadier rhythm overall.`,
        });
      }
    } else {
      insights.push({ type: "gap", text: `Gym consistency was ${gymCons.pct}% — room to build a steadier rhythm` });
    }
  } else if (gymCons && gymCons.pct >= 60 && gymCons.pct < 80) {
    // Not flagged as a gap above, but still below 80 — skip or leave to strengths
  }

  // Other consistency gaps (outdoor/paddle) — check reverse trade-off
  consistency.filter((c) => c.pct < 60 && c.label !== "Gym Sessions").forEach((c) => {
    if (outdoorMissedWithGymOverflow > 0 && c.label.includes("Hike")) {
      insights.push({ type: "gap", text: `${c.label} consistency at ${c.pct}% — some weeks were traded for extra gym sessions` });
    } else {
      insights.push({ type: "gap", text: `${c.label} consistency was ${c.pct}% — room to build a steadier rhythm` });
    }
  });

  // Biggest lever insight
  if (gymCons && outdoorCons && paddleCons) {
    const lowestCons = [gymCons, outdoorCons, paddleCons].sort((a, b) => a.pct - b.pct)[0];
    if (lowestCons.label === "Gym Sessions" && gymMissedWithOutdoorOverflow >= 2) {
      insights.push({
        type: "gap",
        text: `Biggest lever: Gym is the lowest consistency metric at ${lowestCons.pct}%, largely driven by high-volume outdoor weeks. A quick home workout on adventure days could close this gap.`,
      });
    } else if (lowestCons.pct < 60) {
      insights.push({
        type: "gap",
        text: `Biggest lever: ${lowestCons.label} at ${lowestCons.pct}% — focusing here would have the most impact on your overall score.`,
      });
    }
  }

  if (qActivities.length === 0) {
    insights.push({ type: "gap", text: "No activities logged this quarter yet — time to get moving!" });
  }

  // ── Progression trend: first half vs second half of quarter ──
  if (qActivities.length >= 4) {
    const midpointMs = qStartMs + (qEndMs - qStartMs) / 2;
    const firstHalf = qActivities.filter(a => new Date(a.start_time).getTime() < midpointMs);
    const secondHalf = qActivities.filter(a => new Date(a.start_time).getTime() >= midpointMs);

    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const avgDist = (acts: typeof qActivities) => {
        const withDist = acts.filter(a => (a.distance ?? 0) > 0);
        return withDist.length > 0 ? withDist.reduce((s, a) => s + (a.distance ?? 0), 0) / withDist.length : 0;
      };
      const avgElev = (acts: typeof qActivities) => {
        const withElev = acts.filter(a => (a.elevation_gain ?? 0) > 0);
        return withElev.length > 0 ? withElev.reduce((s, a) => s + (a.elevation_gain ?? 0), 0) / withElev.length : 0;
      };

      const distFirst = avgDist(firstHalf);
      const distSecond = avgDist(secondHalf);
      const elevFirst = avgElev(firstHalf);
      const elevSecond = avgElev(secondHalf);

      const distDelta = distFirst > 0 ? ((distSecond - distFirst) / distFirst) * 100 : 0;
      const elevDelta = elevFirst > 0 ? ((elevSecond - elevFirst) / elevFirst) * 100 : 0;

      // Only surface if there's a meaningful trend (>15%)
      if (distDelta > 15 && elevDelta > 15) {
        insights.push({ type: "strength", text: `Building momentum: avg distance up ${Math.round(distDelta)}% and elevation up ${Math.round(elevDelta)}% in the second half of the quarter.` });
      } else if (distDelta > 15) {
        insights.push({ type: "strength", text: `Building momentum: avg distance per outing up ${Math.round(distDelta)}% in the second half of the quarter.` });
      } else if (elevDelta > 15) {
        insights.push({ type: "strength", text: `Building momentum: avg elevation per outing up ${Math.round(elevDelta)}% in the second half of the quarter.` });
      } else if (distDelta < -20 && elevDelta < -20) {
        insights.push({ type: "gap", text: `Fading late: avg distance down ${Math.abs(Math.round(distDelta))}% and elevation down ${Math.abs(Math.round(elevDelta))}% in the second half. Time to push through the plateau.` });
      } else if (distDelta < -20) {
        insights.push({ type: "gap", text: `Distance per outing dropped ${Math.abs(Math.round(distDelta))}% in the second half. Consider scheduling a longer effort to reset momentum.` });
      } else if (elevDelta < -20) {
        insights.push({ type: "gap", text: `Elevation per outing dropped ${Math.abs(Math.round(elevDelta))}% in the second half. Try a hillier route to rebuild climbing fitness.` });
      }
    }
  }

  // Sport breakdown
  const sportMap: Record<string, { label: string; count: number; color: string }> = {
    hiking: { label: "Hike", count: 0, color: "hsl(160, 40%, 50%)" },
    kayaking: { label: "Paddle", count: 0, color: "hsl(200, 60%, 60%)" },
    xc_skiing: { label: "XC Ski", count: 0, color: "hsl(240, 30%, 72%)" },
    orange_theory: { label: "Gym", count: 0, color: "hsl(10, 65%, 58%)" },
    peloton: { label: "Gym", count: 0, color: "hsl(10, 65%, 58%)" },
  };
  qActivities.forEach((a) => {
    if (sportMap[a.type]) sportMap[a.type].count++;
  });
  // Merge gym types
  const gymCount = (sportMap.orange_theory?.count ?? 0) + (sportMap.peloton?.count ?? 0);
  const sportBreakdown: SportBreakdown[] = [
    { type: "hiking", ...sportMap.hiking },
    { type: "kayaking", ...sportMap.kayaking },
    { type: "xc_skiing", ...sportMap.xc_skiing },
    { type: "gym", label: "Gym", count: gymCount, color: "hsl(10, 65%, 58%)" },
  ].filter((s) => s.count > 0);

  // Compute avg elevation for hike/xc_ski activities with elevation
  const elevActivities = qActivities.filter(
    (a) => (a.type === "hiking" || a.type === "xc_skiing") && (a.elevation_gain ?? 0) > 0
  );
  const avgElevation = elevActivities.length > 0
    ? elevActivities.reduce((s, a) => s + (a.elevation_gain ?? 0), 0) / elevActivities.length
    : 0;

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
    sportBreakdown,
    _avgElevation: Math.round(avgElevation),
    _elevationTarget: goals.goal_elevation_avg,
  };
}
