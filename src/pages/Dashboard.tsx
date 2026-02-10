import { useProfile } from "@/hooks/useProfile";
import { useWeekActivities, MILE_ACTIVITIES, EXERCISE_ACTIVITIES } from "@/hooks/useActivities";
import { useWeightEntries } from "@/hooks/useWeightEntries";
import { useAuth } from "@/hooks/useAuth";
import StatCard from "@/components/StatCard";
import AddActivityDialog from "@/components/AddActivityDialog";
import ActivityItem from "@/components/ActivityItem";
import BottomNav from "@/components/BottomNav";
import { MapPin, Dumbbell, Scale, Mountain, Ship } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: weekActivities } = useWeekActivities();
  const { data: weightEntries } = useWeightEntries();

  const exerciseCount = weekActivities?.filter((a) => EXERCISE_ACTIVITIES.includes(a.type as any)).length || 0;
  const outdoorCount = weekActivities?.filter((a) => ["hiking", "xc_skiing"].includes(a.type)).length || 0;
  const kayakCount = weekActivities?.filter((a) => a.type === "kayaking").length || 0;
  const totalMiles = weekActivities
    ?.filter((a) => MILE_ACTIVITIES.includes(a.type as any))
    .reduce((sum, a) => sum + (a.distance || 0), 0) || 0;
  const latestWeight = weightEntries?.length ? weightEntries[weightEntries.length - 1].weight : null;

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 2;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;

  // Show most recent activities (today or this week)
  const recentActivities = weekActivities?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-4 pt-12 pb-8">
        <div className="mx-auto max-w-lg">
          <p className="text-primary-foreground/80 text-sm">Good {getGreeting()}</p>
          <h1 className="text-2xl font-bold text-primary-foreground">
            {profile?.display_name || "Athlete"}
          </h1>
          <p className="text-primary-foreground/60 text-xs mt-1">This week's progress</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Dumbbell className="h-5 w-5" />}
            label="Exercises"
            value={`${exerciseCount}/${exerciseGoal}`}
            unit="/wk"
            progress={(exerciseCount / exerciseGoal) * 100}
            gradient="energy"
          />
          <StatCard
            icon={<Mountain className="h-5 w-5" />}
            label="Hike / XC Ski"
            value={`${outdoorCount}/${outdoorGoal}`}
            unit="/wk"
            progress={(outdoorCount / outdoorGoal) * 100}
            gradient="calm"
          />
          <StatCard
            icon={<Ship className="h-5 w-5" />}
            label="Kayaking"
            value={`${kayakCount}/${kayakGoal}`}
            unit="/wk"
            progress={(kayakCount / kayakGoal) * 100}
            gradient="primary"
          />
          <StatCard
            icon={<MapPin className="h-5 w-5" />}
            label="Total Miles"
            value={totalMiles.toFixed(1)}
            unit="mi"
          />
        </div>

        {/* Weight */}
        {latestWeight !== null && (
          <div className="rounded-xl bg-card p-4 border border-border shadow-card flex items-center gap-3">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Weight</span>
            <span className="ml-auto text-lg font-bold text-foreground">{latestWeight} <span className="text-sm font-normal text-muted-foreground">lbs</span></span>
          </div>
        )}

        {/* Quick Add */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
          <AddActivityDialog />
        </div>

        {/* Activity List */}
        <div className="space-y-2">
          {recentActivities.length > 0 ? (
            recentActivities.map((a) => <ActivityItem key={a.id} activity={a} />)
          ) : (
            <div className="rounded-xl bg-card border border-border p-8 text-center shadow-card">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No activities this week</p>
              <p className="text-sm text-muted-foreground/70">Tap "Log Activity" to get started</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
