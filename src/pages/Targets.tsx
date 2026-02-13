import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import BottomNav from "@/components/BottomNav";
import { Waves, TreePine, Mountain, Dumbbell, Target } from "lucide-react";
import { Loader2 } from "lucide-react";

interface TargetRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function TargetRow({ icon, label, value }: TargetRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function Targets() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 1;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Targets</h1>
        </div>

        {/* Quarterly Targets */}
        <div className="rounded-2xl bg-card p-5 border border-border shadow-card">
          <h2 className="text-base font-semibold text-foreground mb-1">Quarterly Targets</h2>
          <p className="text-xs text-muted-foreground mb-4">Goals to hit each quarter</p>
          <div className="divide-y divide-border">
            <TargetRow
              icon={<Waves className="h-4 w-4" />}
              label="Kayak"
              value="90 miles"
            />
            <TargetRow
              icon={<TreePine className="h-4 w-4" />}
              label="Hiking"
              value="60 miles"
            />
            <TargetRow
              icon={<Mountain className="h-4 w-4" />}
              label="Elevation avg"
              value="1,200 ft"
            />
          </div>
        </div>

        {/* Weekly Rhythm */}
        <div className="rounded-2xl bg-card p-5 border border-border shadow-card">
          <h2 className="text-base font-semibold text-foreground mb-1">Weekly Rhythm</h2>
          <p className="text-xs text-muted-foreground mb-4">Minimum weekly activity targets</p>
          <div className="divide-y divide-border">
            <TargetRow
              icon={<Waves className="h-4 w-4" />}
              label="Paddle"
              value={`${kayakGoal} session${kayakGoal > 1 ? "s" : ""}`}
            />
            <TargetRow
              icon={<TreePine className="h-4 w-4" />}
              label="Hike or ski"
              value={`${outdoorGoal} session${outdoorGoal > 1 ? "s" : ""}`}
            />
            <TargetRow
              icon={<Dumbbell className="h-4 w-4" />}
              label="Gym classes"
              value={`${exerciseGoal} classes`}
            />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
