import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";
import BottomNav from "@/components/BottomNav";
import GoalInsight from "@/components/GoalInsight";
import TrainingLoad from "@/components/TrainingLoad";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Timeframe = "wtd" | "mtd" | "ytd";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: activities } = useActivities();
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>("ytd");

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 1;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;

  const insights = useDashboardInsights(activities, {
    exercises: exerciseGoal,
    outdoor: outdoorGoal,
    kayak: kayakGoal,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-8 space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PS FitTrackr
          </h1>
          <p className="text-muted-foreground">Let's get moving!</p>
        </header>

        {/* Miles Summary Cards — Enhanced with deltas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Week to Date",
              val: insights?.wtd.miles ?? 0,
              delta: insights?.weekDelta,
              sub: insights ? `3-wk avg: ${insights.threeWeekAvg.toFixed(1)} mi` : undefined,
            },
            { label: "Month to Date", val: insights?.mtd.miles ?? 0 },
            { label: "Year to Date", val: insights?.ytd.miles ?? 0 },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl bg-card p-6 border border-border shadow-elevated animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
              <p className="text-4xl font-extrabold mt-2 text-foreground tracking-tight">
                {card.val.toFixed(1)} <span className="text-base font-normal text-muted-foreground">mi</span>
              </p>
              {card.delta !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  {card.delta >= 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <ArrowUpRight className="h-3.5 w-3.5" />+{card.delta.toFixed(1)} vs last week
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                      <ArrowDownRight className="h-3.5 w-3.5" />{card.delta.toFixed(1)} vs last week
                    </span>
                  )}
                </div>
              )}
              {card.sub && (
                <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Active Streak Banner */}
        {insights && Math.max(insights.streaks.outdoor, insights.streaks.classes, insights.streaks.water) > 1 && (
          <div className="rounded-2xl gradient-energy p-4 flex items-center gap-3 animate-fade-in">
            <Flame className="h-6 w-6 text-accent-foreground" />
            <div>
              <p className="text-sm font-bold text-accent-foreground">
                {(() => {
                  const best = Object.entries(insights.streaks).reduce((a, b) => b[1] > a[1] ? b : a);
                  const labels: Record<string, string> = { outdoor: "outdoor goal", classes: "classes goal", water: "kayak goal", miles: "active miles" };
                  return `${best[1]}-week streak hitting ${labels[best[0]]}!`;
                })()}
              </p>
              <p className="text-xs text-accent-foreground/80">Keep the momentum going</p>
            </div>
          </div>
        )}

        {/* Mileage Breakout Chart */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-elevated">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Outdoor Mileage Breakout</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cumulative:{" "}
                <span className="text-foreground font-bold">
                  {(insights?.breakdowns[chartTimeframe]?.total ?? 0).toFixed(1)} mi
                </span>
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              {(["wtd", "mtd", "ytd"] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTimeframe(t)}
                  className={`px-4 py-1.5 text-xs rounded-md transition-colors uppercase font-bold tracking-tight ${
                    chartTimeframe === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights?.breakdowns[chartTimeframe]?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="miles" radius={[6, 6, 0, 0]} animationDuration={800}>
                  {(insights?.breakdowns[chartTimeframe]?.data ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Goals — Insight-enriched */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Weekly Goals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GoalInsight
              label="Classes"
              current={insights?.wtd.classes ?? 0}
              target={exerciseGoal}
              color="#ec4899"
              note={insights?.goalNotes.classes ?? ""}
              streak={insights?.streaks.classes ?? 0}
            />
            <GoalInsight
              label="Outdoor"
              current={insights?.wtd.outdoor ?? 0}
              target={outdoorGoal}
              color="#22c55e"
              note={insights?.goalNotes.outdoor ?? ""}
              streak={insights?.streaks.outdoor ?? 0}
            />
            <GoalInsight
              label="Kayak"
              current={insights?.wtd.water ?? 0}
              target={kayakGoal}
              color="#0ea5e9"
              note={insights?.goalNotes.water ?? ""}
              streak={insights?.streaks.water ?? 0}
            />
          </div>
        </div>

        {/* Training Load */}
        {insights && (
          <TrainingLoad
            last7={insights.load.last7}
            last30={insights.load.last30}
            trend={insights.load.trend}
            risk={insights.load.risk}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
