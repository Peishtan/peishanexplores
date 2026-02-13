import { useProfile } from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";
import BottomNav from "@/components/BottomNav";
import heroImage from "@/assets/hero-outdoor.jpg";
import { CheckCircle2, Waves, TreePine, Dumbbell, Flame } from "lucide-react";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: activities } = useActivities();

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 1;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;

  const insights = useDashboardInsights(activities, {
    exercises: exerciseGoal,
    outdoor: outdoorGoal,
    kayak: kayakGoal,
  });

  const paceColor = (pace: string) =>
    pace === "ahead" ? "text-primary" : pace === "on_pace" ? "text-muted-foreground" : "text-destructive";
  const paceLabel = (pace: string) =>
    pace === "ahead" ? "Ahead of pace" : pace === "on_pace" ? "Goal on pace" : "Behind pace";

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">PS FitTrackr</h1>
        </header>

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-elevated">
          <img
            src={heroImage}
            alt="Mountain landscape"
            className="w-full h-48 md:h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider mb-1">2026 Total Miles</p>
            <p className="text-3xl font-extrabold text-primary-foreground">
              {(insights?.ytd.miles ?? 0).toFixed(0)} <span className="text-base font-medium text-primary-foreground/80">miles</span>
            </p>
            <span className="mt-2 inline-block bg-primary-foreground/20 backdrop-blur-sm rounded-md px-3 py-1 text-xs font-semibold text-primary-foreground/90">
              Q{Math.floor(new Date().getMonth() / 3) + 1}: {(insights?.qtd.miles ?? 0).toFixed(0)} miles so far
            </span>
          </div>
        </div>

        {/* Challenge + Hiking Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kayak Challenge */}
          <div className="rounded-2xl bg-card p-5 border border-border shadow-card">
            <h3 className="text-base font-semibold text-foreground mb-3">
              {insights?.kayakChallenge.label ?? "Kayak Challenge"}
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <Waves className="h-5 w-5 text-chart-2 shrink-0" />
              <span className="text-2xl font-extrabold text-foreground">
                {(insights?.kayakChallenge.current ?? 0).toFixed(0)}
              </span>
              <span className="text-muted-foreground">/ {insights?.kayakChallenge.target ?? 90} miles</span>
            </div>
            {/* Progress bar */}
            <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${insights?.kayakChallenge.pct ?? 0}%`,
                  background: "hsl(var(--chart-2))",
                }}
              />
            </div>
            <p className={`text-sm font-medium italic ${paceColor(insights?.kayakChallenge.pace ?? "on_pace")}`}>
              {paceLabel(insights?.kayakChallenge.pace ?? "on_pace")}
            </p>
            {insights?.kayakChallenge.projectedFinish && (
              <p className="text-xs text-muted-foreground mt-1">
                Projected finish: <span className="font-semibold text-foreground">{insights.kayakChallenge.projectedFinish}</span>{" "}
                ({insights.kayakChallenge.pct.toFixed(0)}%)
              </p>
            )}
          </div>

          {/* Hiking Progress */}
          <div className="rounded-2xl bg-card p-5 border border-border shadow-card">
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <TreePine className="h-4 w-4 text-primary" />
              Q{Math.floor(new Date().getMonth() / 3) + 1} Hiking Progress
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {(insights?.hikingTotal.miles ?? 0).toFixed(0)}
              </span>
              <span className="text-muted-foreground">mi</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights?.hikingTotal.count ?? 0} hikes this quarter
            </p>
            {(insights?.hikingTotal.avgElevation ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg elevation</p>
                  <p className="text-sm font-bold text-foreground">{insights!.hikingTotal.avgElevation.toLocaleString()} ft</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Highest hike</p>
                  <p className="text-sm font-bold text-foreground">{insights!.hikingTotal.maxElevation.toLocaleString()} ft</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="rounded-2xl bg-card p-5 border border-border shadow-card">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            Q{Math.floor(new Date().getMonth() / 3) + 1} Weekly Goals
          </h3>
          <div className="space-y-4">
            {/* Kayak Goal */}
            <GoalRow
              icon={<Waves className="h-4 w-4" />}
              label="Kayak"
              hit={insights?.quarterWeeklyGoals.kayak.hit ?? 0}
              total={insights?.quarterWeeklyGoals.kayak.total ?? 0}
              description="At least 1 paddle each week"
              met={(insights?.wtd.water ?? 0) >= kayakGoal}
              streak={insights?.streaks.water ?? 0}
            />
            {/* Outdoor Goal */}
            <GoalRow
              icon={<TreePine className="h-4 w-4" />}
              label="Outdoor"
              hit={insights?.quarterWeeklyGoals.outdoor.hit ?? 0}
              total={insights?.quarterWeeklyGoals.outdoor.total ?? 0}
              description="1 hike or XC ski each week"
              met={(insights?.wtd.outdoor ?? 0) >= outdoorGoal}
              streak={insights?.streaks.outdoor ?? 0}
            />
            {/* Classes Goal */}
            <GoalRow
              icon={<Dumbbell className="h-4 w-4" />}
              label="Gym Classes"
              hit={insights?.quarterWeeklyGoals.classes.hit ?? 0}
              total={insights?.quarterWeeklyGoals.classes.total ?? 0}
              description={`${exerciseGoal} classes per week`}
              met={(insights?.wtd.classes ?? 0) >= exerciseGoal}
              streak={insights?.streaks.classes ?? 0}
            />
          </div>
          {/* Streak banner */}
          {insights && Math.max(insights.streaks.outdoor, insights.streaks.classes, insights.streaks.water) > 2 && (
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Great consistency!</span>
            </div>
          )}
        </div>

        {/* Miles Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "This Week", val: insights?.wtd.miles ?? 0, delta: insights?.weekDelta },
            { label: "Month", val: insights?.mtd.miles ?? 0 },
            { label: "Year", val: insights?.ytd.miles ?? 0 },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl bg-card p-4 border border-border shadow-card text-center">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">
                {card.val.toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">mi</p>
              {card.delta !== undefined && (
                <p className={`text-[10px] font-semibold mt-1 ${card.delta >= 0 ? "text-primary" : "text-destructive"}`}>
                  {card.delta >= 0 ? "+" : ""}{card.delta.toFixed(1)} vs last wk
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function GoalRow({
  icon,
  label,
  hit,
  total,
  description,
  met,
  streak,
}: {
  icon: React.ReactNode;
  label: string;
  hit: number;
  total: number;
  description: string;
  met: boolean;
  streak: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {label}{" "}
            <span className="font-bold">{hit}</span>
            <span className="text-muted-foreground font-normal"> / {total}</span>
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {streak > 1 && (
            <p className="text-[10px] text-accent font-bold mt-0.5 flex items-center gap-1">
              <Flame className="h-3 w-3" /> {streak}-week streak
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {Array.from({ length: Math.min(total, 6) }, (_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full flex items-center justify-center ${
              i < hit ? "bg-primary/15" : "bg-muted"
            }`}
          >
            {i < hit && <CheckCircle2 className="h-3 w-3 text-primary" />}
          </div>
        ))}
        {met && <CheckCircle2 className="h-4 w-4 text-primary ml-1" />}
      </div>
    </div>
  );
}
