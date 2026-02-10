import { useProfile } from "@/hooks/useProfile";
import { useTodayActivities } from "@/hooks/useActivities";
import { useWeightEntries } from "@/hooks/useWeightEntries";
import { useAuth } from "@/hooks/useAuth";
import StatCard from "@/components/StatCard";
import AddActivityDialog from "@/components/AddActivityDialog";
import ActivityItem from "@/components/ActivityItem";
import BottomNav from "@/components/BottomNav";
import { Footprints, Clock, Flame, Scale, Dumbbell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: todayActivities } = useTodayActivities();
  const { data: weightEntries } = useWeightEntries();

  const totalDuration = todayActivities?.reduce((sum, a) => sum + a.duration, 0) || 0;
  const totalCalories = todayActivities?.reduce((sum, a) => sum + (a.calories || 0), 0) || 0;
  const totalDistance = todayActivities?.reduce((sum, a) => sum + (a.distance || 0), 0) || 0;
  const workoutCount = todayActivities?.length || 0;
  const latestWeight = weightEntries?.length ? weightEntries[weightEntries.length - 1].weight : null;

  const calorieProgress = profile?.goal_calories ? (totalCalories / profile.goal_calories) * 100 : 0;
  const minuteProgress = profile?.goal_active_minutes ? (totalDuration / profile.goal_active_minutes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-4 pt-12 pb-8">
        <div className="mx-auto max-w-lg">
          <p className="text-primary-foreground/80 text-sm">Good {getGreeting()}</p>
          <h1 className="text-2xl font-bold text-primary-foreground">
            {profile?.display_name || "Athlete"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Active Minutes"
            value={totalDuration}
            unit="min"
            progress={minuteProgress}
            gradient="primary"
          />
          <StatCard
            icon={<Flame className="h-5 w-5" />}
            label="Calories"
            value={totalCalories}
            unit="cal"
            progress={calorieProgress}
            gradient="energy"
          />
          <StatCard
            icon={<Footprints className="h-5 w-5" />}
            label="Distance"
            value={totalDistance.toFixed(1)}
            unit="km"
            gradient="calm"
          />
          <StatCard
            icon={<Scale className="h-5 w-5" />}
            label="Weight"
            value={latestWeight ?? "—"}
            unit={latestWeight ? "kg" : ""}
          />
        </div>

        {/* Quick Add */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Activities</h2>
          <AddActivityDialog />
        </div>

        {/* Activity List */}
        <div className="space-y-2">
          {todayActivities && todayActivities.length > 0 ? (
            todayActivities.map((a) => <ActivityItem key={a.id} activity={a} />)
          ) : (
            <div className="rounded-xl bg-card border border-border p-8 text-center shadow-card">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No activities yet today</p>
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
