import { useProfile } from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";
import { useRecentlyCompletedMilestones } from "@/hooks/useMilestones";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { CheckCircle2, Flame, Waves, Mountain, Dumbbell, Footprints, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

        {/* Weekly Goals */}
        <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">{qLabel} Weekly Goals</h3>
          <div className="space-y-4">
            <GoalRow
              icon={<Waves className="h-4 w-4 text-muted-foreground" />}
              label="Kayak"
              weekResults={insights?.quarterWeeklyGoals.kayak.weekResults ?? []}
              total={insights?.quarterWeeklyGoals.kayak.total ?? 0}
              description="1 paddle each week"
              met={(insights?.wtd.water ?? 0) >= kayakGoal}
              streak={insights?.streaks.water ?? 0}
            />
            <GoalRow
              icon={<Mountain className="h-4 w-4 text-muted-foreground" />}
              label="Hiking / XC Ski"
              weekResults={insights?.quarterWeeklyGoals.outdoor.weekResults ?? []}
              total={insights?.quarterWeeklyGoals.outdoor.total ?? 0}
              description="1 hike or XC ski each week"
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

        {/* Miles Summary */}
        <div className="grid grid-cols-3 gap-3">
          <MilesCard label="Weekly Story" value={insights?.wtd.miles ?? 0} delta={insights?.weekDelta} />
          <MilesCard label="Quarterly" value={insights?.qtd.miles ?? 0} />
          <MilesCard label="Year to Date" value={insights?.ytd.miles ?? 0} />
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

function MilesCard({ label, value, delta }: { label: string; value: number; delta?: number }) {
  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card text-center">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value.toFixed(1)}</p>
      <p className="text-[10px] text-muted-foreground">mi</p>
      {delta !== undefined && (
        <p className={`text-[10px] font-semibold mt-1 ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)} vs last wk
        </p>
      )}
    </div>
  );
}

function MilestoneSpotlight() {
  const { data: milestones } = useRecentlyCompletedMilestones(5);

  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        Milestone Spotlight
      </h3>
      <div className="space-y-0 divide-y divide-border">
        {milestones.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{m.title}</span>
            </div>
            {m.completed_at && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(m.completed_at), { addSuffix: true })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
