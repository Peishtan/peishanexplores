import { useState, useEffect, useMemo } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import SkillMilestonesCard from "@/components/SkillMilestonesCard";
import { Waves, Mountain, Footprints, Dumbbell, Target, Pencil, Check, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function getQuarterBounds(now: Date) {
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(y, q * 3, 1);
  const end = new Date(y, (q + 1) * 3, 0, 23, 59, 59, 999);
  return { start, end };
}

interface TargetRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  suffix?: string;
  pacing?: { needed: number; current: number; unit: string } | null;
}

function TargetRow({ icon, label, value, isEditing, editValue, onEditChange, suffix, pacing }: TargetRowProps) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-right text-foreground"
            />
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          </div>
        ) : (
          <span className="text-sm font-bold text-foreground">{value}</span>
        )}
      </div>
      {!isEditing && pacing && (
        <div className="ml-7 mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
          <span>{pacing.unit === "ft" ? `Target: ${pacing.needed.toLocaleString()} ${pacing.unit}` : `Need ${pacing.needed.toFixed(1)} ${pacing.unit}/wk`}</span>
          <span>•</span>
          <span className={pacing.current >= pacing.needed ? "text-primary font-medium" : "text-destructive font-medium"}>
            Avg: {pacing.unit === "ft" ? `${pacing.current.toLocaleString()} ${pacing.unit}` : `${pacing.current.toFixed(1)} ${pacing.unit}/wk`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Targets() {
  const { data: profile, isLoading } = useProfile();
  const { data: activities } = useActivities();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);

  const [kayakQ, setKayakQ] = useState("90");
  const [hikingQ, setHikingQ] = useState("60");
  const [elevAvg, setElevAvg] = useState("1200");
  const [kayakW, setKayakW] = useState("1");
  const [outdoorW, setOutdoorW] = useState("1");
  const [gymW, setGymW] = useState("3");

  useEffect(() => {
    if (profile) {
      setKayakQ(String(profile.goal_kayak_quarterly_miles ?? 90));
      setHikingQ(String(profile.goal_hiking_quarterly_miles ?? 60));
      setElevAvg(String(profile.goal_elevation_avg ?? 1200));
      setKayakW(String(profile.goal_kayak_per_week ?? 1));
      setOutdoorW(String(profile.goal_outdoor_per_week ?? 1));
      setGymW(String(profile.goal_exercises_per_week ?? 3));
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      {
        goal_kayak_quarterly_miles: parseInt(kayakQ) || 90,
        goal_hiking_quarterly_miles: parseInt(hikingQ) || 60,
        goal_elevation_avg: parseInt(elevAvg) || 1200,
        goal_kayak_per_week: parseInt(kayakW) || 1,
        goal_outdoor_per_week: parseInt(outdoorW) || 1,
        goal_exercises_per_week: parseInt(gymW) || 3,
      } as any,
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Targets saved");
        },
      }
    );
  };

  // Pacing model
  const pacing = useMemo(() => {
    const now = new Date();
    const { start, end } = getQuarterBounds(now);
    const totalWeeks = (end.getTime() - start.getTime()) / (7 * 86400000);
    const weeksElapsed = Math.max((now.getTime() - start.getTime()) / (7 * 86400000), 0.1);
    const weeksRemaining = Math.max(totalWeeks - weeksElapsed, 0.1);

    const qActivities = activities?.filter(a => {
      const d = new Date(a.start_time);
      return d >= start && d <= end;
    }) ?? [];

    const kayakMiles = qActivities.filter(a => a.type === "kayaking").reduce((s, a) => s + (a.distance ?? 0), 0);
    const hikingMiles = qActivities.filter(a => ["hiking", "xc_skiing"].includes(a.type)).reduce((s, a) => s + (a.distance ?? 0), 0);
    const elevations = qActivities.filter(a => (a.elevation_gain ?? 0) > 0);
    const avgElev = elevations.length > 0 ? elevations.reduce((s, a) => s + (a.elevation_gain ?? 0), 0) / elevations.length : 0;

    const kayakTarget = parseInt(kayakQ) || 90;
    const hikingTarget = parseInt(hikingQ) || 60;
    const elevTarget = parseInt(elevAvg) || 1200;

    const kayakRemaining = Math.max(kayakTarget - kayakMiles, 0);
    const hikingRemaining = Math.max(hikingTarget - hikingMiles, 0);

    return {
      kayak: { needed: kayakRemaining / weeksRemaining, current: kayakMiles / weeksElapsed, unit: "mi" },
      hiking: { needed: hikingRemaining / weeksRemaining, current: hikingMiles / weeksElapsed, unit: "mi" },
      elev: { needed: elevTarget, current: Math.round(avgElev), unit: "ft" },
    };
  }, [activities, kayakQ, hikingQ, elevAvg]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">PS FitTrackr</h1>
        </header>

        <HeroBanner title="Targets" />

        <div className="flex justify-end">
          {editing ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
              <button onClick={handleSave} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quarterly Targets */}
        <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-1">Quarterly Targets</h2>
          <p className="text-xs text-muted-foreground mb-3">Goals to hit each quarter</p>
          <div className="divide-y divide-border">
            <TargetRow icon={<Waves className="h-4 w-4" />} label="Kayak" value={`${kayakQ} miles`} isEditing={editing} editValue={kayakQ} onEditChange={setKayakQ} suffix="mi" pacing={pacing.kayak} />
            <TargetRow icon={<Footprints className="h-4 w-4" />} label="Hiking" value={`${hikingQ} miles`} isEditing={editing} editValue={hikingQ} onEditChange={setHikingQ} suffix="mi" pacing={pacing.hiking} />
            <TargetRow icon={<Mountain className="h-4 w-4" />} label="Elevation avg" value={`${parseInt(elevAvg).toLocaleString()} ft`} isEditing={editing} editValue={elevAvg} onEditChange={setElevAvg} suffix="ft" pacing={{ needed: pacing.elev.needed, current: pacing.elev.current, unit: "ft" }} />
          </div>
        </div>

        {/* Weekly Rhythm */}
        <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-1">Weekly Rhythm</h2>
          <p className="text-xs text-muted-foreground mb-3">Minimum weekly activity targets</p>
          <div className="divide-y divide-border">
            <TargetRow icon={<Waves className="h-4 w-4" />} label="Paddle" value={`${kayakW} session${parseInt(kayakW) > 1 ? "s" : ""}`} isEditing={editing} editValue={kayakW} onEditChange={setKayakW} />
            <TargetRow icon={<Footprints className="h-4 w-4" />} label="Hike or ski" value={`${outdoorW} session${parseInt(outdoorW) > 1 ? "s" : ""}`} isEditing={editing} editValue={outdoorW} onEditChange={setOutdoorW} />
            <TargetRow icon={<Dumbbell className="h-4 w-4" />} label="Gym classes" value={`${gymW} classes`} isEditing={editing} editValue={gymW} onEditChange={setGymW} />
          </div>
        </div>
        {/* Skill Milestones */}
        <SkillMilestonesCard />
      </main>
      <BottomNav />
    </div>
  );
}