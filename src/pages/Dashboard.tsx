import { useMemo, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useActivities, MILE_ACTIVITIES } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import GoalCircle from "@/components/GoalCircle";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { startOfWeek, endOfWeek, startOfMonth, startOfYear } from "date-fns";

const SPORTS = [
  { id: "kayaking", label: "Kayaking", color: "#c92a32", category: "water" },
  { id: "hiking", label: "Hiking", color: "#278737", category: "wild" },
  { id: "xc_skiing", label: "XC Skiing", color: "#2a6dc9", category: "wild" },
  { id: "orange_theory", label: "Orange Theory", color: "#ef4444", category: "class" },
  { id: "peloton", label: "Peloton", color: "#ec4899", category: "class" },
];

type Timeframe = "wtd" | "mtd" | "ytd";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: activities } = useActivities();
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>("ytd");

  const stats = useMemo(() => {
    if (!activities) return null;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }).getTime();
    const monthStart = startOfMonth(now).getTime();
    const yearStart = startOfYear(now).getTime();

    const filterByStart = (start: number) =>
      activities.filter((a) => new Date(a.start_time).getTime() >= start);

    const weekLogs = filterByStart(weekStart);
    const monthLogs = filterByStart(monthStart);
    const yearLogs = filterByStart(yearStart);

    const getMiles = (logs: typeof activities) =>
      logs.filter((a) => MILE_ACTIVITIES.includes(a.type as any)).reduce((s, a) => s + (a.distance || 0), 0);

    const getGoals = (logs: typeof activities) => ({
      classes: logs.filter((a) => ["peloton", "orange_theory"].includes(a.type)).length,
      wild: logs.filter((a) => ["hiking", "xc_skiing"].includes(a.type)).length,
      water: logs.filter((a) => a.type === "kayaking").length,
    });

    const getBreakdown = (logs: typeof activities) => {
      const k = logs.filter((a) => a.type === "kayaking").reduce((s, a) => s + (a.distance || 0), 0);
      const h = logs.filter((a) => a.type === "hiking").reduce((s, a) => s + (a.distance || 0), 0);
      const x = logs.filter((a) => a.type === "xc_skiing").reduce((s, a) => s + (a.distance || 0), 0);
      return {
        data: [
          { name: "Kayaking", miles: k, color: "#c92a32" },
          { name: "XC Skiing", miles: x, color: "#2a6dc9" },
          { name: "Hiking", miles: h, color: "#278737" },
        ],
        total: k + h + x,
      };
    };

    return {
      wtd: { miles: getMiles(weekLogs), goals: getGoals(weekLogs) },
      mtd: { miles: getMiles(monthLogs), goals: getGoals(monthLogs) },
      ytd: { miles: getMiles(yearLogs), goals: getGoals(yearLogs) },
      breakdowns: {
        wtd: getBreakdown(weekLogs),
        mtd: getBreakdown(monthLogs),
        ytd: getBreakdown(yearLogs),
      },
    };
  }, [activities]);

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 1;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {profile?.display_name ? `${profile.display_name}'s Tracker` : "Activity Tracker"}
          </h1>
          <p className="text-muted-foreground">Let's get moving!</p>
        </header>

        {/* Miles Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Week to Date", val: stats?.wtd.miles ?? 0 },
            { label: "Month to Date", val: stats?.mtd.miles ?? 0 },
            { label: "Year to Date", val: stats?.ytd.miles ?? 0 },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl bg-card p-6 border border-border shadow-card">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
              <p className="text-4xl font-bold mt-2 text-foreground">
                {card.val.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">mi</span>
              </p>
            </div>
          ))}
        </div>

        {/* Mileage Breakout Chart */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Outdoor Mileage Breakout</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cumulative:{" "}
                <span className="text-foreground font-bold">
                  {(stats?.breakdowns[chartTimeframe]?.total ?? 0).toFixed(1)} mi
                </span>
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              {(["wtd", "mtd", "ytd"] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTimeframe(t)}
                  className={`px-4 py-1 text-xs rounded-md transition-colors uppercase font-bold tracking-tight ${
                    chartTimeframe === t
                      ? "bg-secondary text-foreground shadow-sm"
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
              <BarChart data={stats?.breakdowns[chartTimeframe]?.data ?? []}>
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
                <Bar dataKey="miles" radius={[4, 4, 0, 0]}>
                  {(stats?.breakdowns[chartTimeframe]?.data ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="rounded-2xl bg-card p-6 border border-border shadow-card">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Weekly Goal Status</h2>
          <div className="grid grid-cols-3 gap-6">
            <GoalCircle label={`Classes (Goal: ${exerciseGoal})`} current={stats?.wtd.goals.classes ?? 0} target={exerciseGoal} color="#ec4899" />
            <GoalCircle label={`Outdoor (Goal: ${outdoorGoal})`} current={stats?.wtd.goals.wild ?? 0} target={outdoorGoal} color="#278737" />
            <GoalCircle label={`Kayak (Goal: ${kayakGoal})`} current={stats?.wtd.goals.water ?? 0} target={kayakGoal} color="#c92a32" />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
