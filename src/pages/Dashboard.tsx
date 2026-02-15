import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { useActivities } from "@/hooks/useActivities";
import { useDashboardInsights, type SparkPoint } from "@/hooks/useDashboardInsights";
import { useAchievedMilestones } from "@/hooks/useSkillMilestones";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { CheckCircle2, Flame, Waves, Mountain, Dumbbell, Footprints, Trophy, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: activities } = useActivities();

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 1;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;
  const hikingTarget = profile?.goal_hiking_quarterly_miles ?? 60;
  const kayakTarget = profile?.goal_kayak_quarterly_miles ?? 90;

  const insights = useDashboardInsights(activities, {
    exercises: exerciseGoal,
    outdoor: outdoorGoal,
    kayak: kayakGoal,
    hikingTarget,
    kayakTarget,
  });

  const paceColor = (pace: string) =>
    pace === "ahead" ? "text-primary" : pace === "on_pace" ? "text-muted-foreground" : "text-destructive";
  const paceLabel = (pace: string) =>
    pace === "ahead" ? "Ahead of pace" : pace === "on_pace" ? "On Track" : "Behind pace";

  const qLabel = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">PS FitTrackr</h1>
        </header>

        {/* Hero Banner */}
        <HeroBanner title="Dashboard" />

        {/* Challenge Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Kayak Challenge */}
          <ChallengeCard
            icon={<Waves className="h-4 w-4 text-muted-foreground" />}
            title={`${qLabel} Kayak Challenge`}
            current={insights?.kayakChallenge.current ?? 0}
            target={kayakTarget}
            pct={insights?.kayakChallenge.pct ?? 0}
            pace={insights?.kayakChallenge.pace ?? "on_pace"}
            paceColor={paceColor}
            paceLabel={paceLabel}
            projectedFinish={insights?.kayakChallenge.projectedFinish ?? null}
          />

          {/* Hiking Progress */}
          <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Footprints className="h-4 w-4 text-muted-foreground" />
              {qLabel} Hiking / XC Ski Challenge
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[32px] font-bold text-foreground">
                {(insights?.hikingTotal.miles ?? 0).toFixed(0)}
              </span>
              <span className="text-sm text-muted-foreground">/ {hikingTarget} miles</span>
            </div>
            {/* Progress bar */}
            <div className="h-2.5 rounded-full bg-border overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${Math.min(((insights?.hikingTotal.miles ?? 0) / hikingTarget) * 100, 100)}%` }}
              />
            </div>
            <p className={`text-sm font-medium italic ${paceColor(insights?.hikingChallenge?.pace ?? "on_pace")}`}>
              {paceLabel(insights?.hikingChallenge?.pace ?? "on_pace")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {insights?.hikingTotal.count ?? 0} hikes / XC ski this quarter
              {(insights?.hikingTotal.avgElevation ?? 0) > 0 && (
                <> · Avg Elev {insights!.hikingTotal.avgElevation.toLocaleString()} ft · High {insights!.hikingTotal.maxElevation.toLocaleString()} ft</>
              )}
            </p>
          </div>
        </div>

        {/* Weekly Goals + Momentum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 rounded-2xl bg-card p-4 border border-border shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">{qLabel} Weekly Goals</h3>
            <div className="space-y-4">
              <GoalRow
                icon={<Waves className="h-4 w-4 text-muted-foreground" />}
                label="Kayak"
                weekResults={insights?.quarterWeeklyGoals.kayak.weekResults ?? []}
                total={insights?.quarterWeeklyGoals.kayak.total ?? 0}
                description={`${kayakGoal} paddle each week`}
                met={(insights?.wtd.water ?? 0) >= kayakGoal}
                streak={insights?.streaks.water ?? 0}
              />
              <GoalRow
                icon={<Mountain className="h-4 w-4 text-muted-foreground" />}
                label="Hiking / XC Ski"
                weekResults={insights?.quarterWeeklyGoals.outdoor.weekResults ?? []}
                total={insights?.quarterWeeklyGoals.outdoor.total ?? 0}
                description={`${outdoorGoal} hike or XC ski each week`}
                met={(insights?.wtd.outdoor ?? 0) >= outdoorGoal}
                streak={insights?.streaks.outdoor ?? 0}
              />
              <GoalRow
                icon={<Dumbbell className="h-4 w-4 text-muted-foreground" />}
                label="Gym Classes"
                weekResults={insights?.quarterWeeklyGoals.classes.weekResults ?? []}
                total={insights?.quarterWeeklyGoals.classes.total ?? 0}
                description={`${exerciseGoal} classes per week`}
                met={(insights?.wtd.classes ?? 0) >= exerciseGoal}
                streak={insights?.streaks.classes ?? 0}
              />
            </div>
          </div>
          <MomentumCard momentum={insights?.momentum ?? null} kayakChallenge={insights?.kayakChallenge ?? null} hikingChallenge={insights?.hikingChallenge ?? null} />
        </div>

        {/* Miles Summary */}
        <div className="grid grid-cols-3 gap-3">
          <MilesCard label="Weekly" value={insights?.wtd.miles ?? 0} spark={insights?.sparkWeekly} />
          <MilesCard label="Quarterly" value={insights?.qtd.miles ?? 0} spark={insights?.sparkQuarterly} />
          <MilesCard label="Year to Date" value={insights?.ytd.miles ?? 0} spark={insights?.sparkYtd} />
        </div>

        {/* Milestone Spotlight */}
        <MilestoneSpotlight />

      </main>
      <BottomNav />
    </div>
  );
}

function ChallengeCard({
  icon, title, current, target, pct, pace, paceColor, paceLabel, projectedFinish,
}: {
  icon: React.ReactNode; title: string; current: number; target: number; pct: number;
  pace: string; paceColor: (p: string) => string; paceLabel: (p: string) => string;
  projectedFinish: string | null;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[32px] font-bold text-foreground">{current.toFixed(0)}</span>
        <span className="text-sm text-muted-foreground">/ {target} miles</span>
      </div>
      <div className="h-2.5 rounded-full bg-border overflow-hidden mb-3">
        <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-sm font-medium italic ${paceColor(pace)}`}>{paceLabel(pace)}</p>
      {projectedFinish && (
        <p className="text-xs text-muted-foreground mt-1">
          Projected finish: <span className="font-semibold text-foreground">{projectedFinish}</span> ({pct.toFixed(0)}%)
        </p>
      )}
    </div>
  );
}

function GoalRow({ icon, label, weekResults, total, description, met, streak }: {
  icon: React.ReactNode; label: string; weekResults: boolean[]; total: number;
  description: string; met: boolean; streak: number;
}) {
  const totalWeeksInQuarter = 13;
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {streak > 1 && (
            <p className="text-[10px] text-primary font-bold mt-0.5 flex items-center gap-1">
              <Flame className="h-3 w-3" /> {streak}-week streak
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 pl-7">
        {Array.from({ length: totalWeeksInQuarter }, (_, i) => {
          const isPastOrCurrent = i < total;
          const wasHit = i < weekResults.length ? weekResults[i] : false;
          return (
            <div key={i} className={`h-5 w-5 rounded-full flex items-center justify-center ${
              wasHit ? "bg-primary/15" : isPastOrCurrent ? "bg-muted-foreground/30" : "bg-border"
            }`}>
              {wasHit && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getEncouragement(kayak: import("@/hooks/useDashboardInsights").QuarterChallenge | null, hiking: import("@/hooks/useDashboardInsights").QuarterChallenge | null) {
  if (!kayak || !hiking) return null;

  const bothAhead = kayak.pace !== "behind" && hiking.pace !== "behind";
  const bothBehind = kayak.pace === "behind" && hiking.pace === "behind";
  const oneBehind = kayak.pace === "behind" || hiking.pace === "behind";

  if (bothAhead) {
    const bestPct = Math.max(kayak.pct, hiking.pct);
    if (bestPct >= 90) return { emoji: "🔥", text: "Almost there — finish strong this quarter!" };
    if (bestPct >= 50) return { emoji: "💪", text: "Solid momentum — keep this pace and you'll crush it." };
    return { emoji: "✅", text: "On track across the board. Nice consistency!" };
  }

  if (bothBehind) {
    const kayakGap = Math.max(kayak.target - kayak.current, 0);
    const hikingGap = Math.max(hiking.target - hiking.current, 0);
    return {
      emoji: "🌱",
      text: `Life happens! ${kayakGap.toFixed(0)} kayak mi + ${hikingGap.toFixed(0)} hike mi to go — one big weekend can close the gap.`,
    };
  }

  if (oneBehind) {
    const behind = kayak.pace === "behind" ? kayak : hiking!;
    const label = kayak.pace === "behind" ? "paddle" : "hike/ski";
    const gap = Math.max(behind.target - behind.current, 0);
    return {
      emoji: "👊",
      text: `Just ${gap.toFixed(0)} more ${label} miles to catch up — you've got this.`,
    };
  }

  return null;
}

function MomentumCard({ momentum, kayakChallenge, hikingChallenge }: { momentum: import("@/hooks/useDashboardInsights").MomentumData | null; kayakChallenge: import("@/hooks/useDashboardInsights").QuarterChallenge | null; hikingChallenge: import("@/hooks/useDashboardInsights").QuarterChallenge | null }) {
  if (!momentum) return null;
  const { fourWeekAvgMiles, fourWeekDelta, elevTrendPct, fourWeekAvgElev, priorFourWeekAvgElev, longestHikeThisQ, longestHikeLastQ } = momentum;
  const qLabel = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;
  const lastQLabel = `Q${((Math.floor(new Date().getMonth() / 3) - 1 + 4) % 4) + 1}`;

  const TrendIcon = elevTrendPct > 0 ? TrendingUp : elevTrendPct < 0 ? TrendingDown : Minus;
  const elevColor = elevTrendPct > 0 ? "text-primary" : elevTrendPct < 0 ? "text-destructive" : "text-muted-foreground";

  const encouragement = getEncouragement(kayakChallenge, hikingChallenge);

  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        Momentum
      </h3>
      <div className="space-y-4">
        {/* Encouragement */}
        {encouragement && (
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-foreground leading-relaxed">
              <span className="mr-1.5">{encouragement.emoji}</span>
              {encouragement.text}
            </p>
          </div>
        )}

        {/* 4-week avg miles */}
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">4-Week Avg Miles</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-foreground">{fourWeekAvgMiles.toFixed(1)}</span>
            <span className={`text-xs font-semibold ${fourWeekDelta >= 0 ? "text-primary" : "text-destructive"}`}>
              {fourWeekDelta >= 0 ? "+" : ""}{fourWeekDelta.toFixed(1)} vs prior 4 wks
            </span>
          </div>
        </div>

        {/* Elevation trend */}
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Elevation Trend</p>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendIcon className={`h-4 w-4 ${elevColor}`} />
            <span className={`text-xl font-bold ${elevColor}`}>
              {elevTrendPct > 0 ? "+" : ""}{elevTrendPct}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            4-wk avg: {fourWeekAvgElev.toLocaleString()} ft
            {priorFourWeekAvgElev > 0 && <> · prior: {priorFourWeekAvgElev.toLocaleString()} ft</>}
          </p>
        </div>

        {/* Longest hike */}
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Longest Hike</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-foreground">{longestHikeThisQ.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">mi ({qLabel})</span>
          </div>
          {longestHikeLastQ > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lastQLabel}: {longestHikeLastQ.toFixed(1)} mi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MilesCard({ label, value, spark }: { label: string; value: number; spark?: SparkPoint[] }) {
  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card text-center">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value.toFixed(1)}</p>
      <p className="text-[10px] text-muted-foreground">mi</p>
      {spark && spark.length > 1 && (
        <div className="mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="miles"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/\s+/g, '-')})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MilestoneSpotlight() {
  const { data: achieved } = useAchievedMilestones(3);

  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        Spotlight: Latest Milestones
      </h3>
      {!achieved || achieved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Target className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No milestones unlocked yet!</p>
          <Link
            to="/targets"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View milestones →
          </Link>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border">
          {achieved.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{p.skill_milestones?.title}</span>
              </div>
              {p.achieved_at && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(p.achieved_at), "MMM d")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
