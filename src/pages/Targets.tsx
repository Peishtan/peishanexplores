import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useMilestones, useAddMilestone, useToggleMilestone, useDeleteMilestone } from "@/hooks/useMilestones";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { Waves, Mountain, Footprints, Dumbbell, Target, Pencil, Check, X, Plus, Trash2, Trophy, Circle, CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TargetRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  suffix?: string;
}

function TargetRow({ icon, label, value, isEditing, editValue, onEditChange, suffix }: TargetRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
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
  );
}

export default function Targets() {
  const { data: profile, isLoading } = useProfile();
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

        <div className="flex items-center justify-between">
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
            <TargetRow icon={<Waves className="h-4 w-4" />} label="Kayak" value={`${kayakQ} miles`} isEditing={editing} editValue={kayakQ} onEditChange={setKayakQ} suffix="mi" />
            <TargetRow icon={<Footprints className="h-4 w-4" />} label="Hiking" value={`${hikingQ} miles`} isEditing={editing} editValue={hikingQ} onEditChange={setHikingQ} suffix="mi" />
            <TargetRow icon={<Mountain className="h-4 w-4" />} label="Elevation avg" value={`${parseInt(elevAvg).toLocaleString()} ft`} isEditing={editing} editValue={elevAvg} onEditChange={setElevAvg} suffix="ft" />
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
        <MilestonesSection />
      </main>
      <BottomNav />
    </div>
  );
}

function MilestonesSection() {
  const { data: milestones, isLoading } = useMilestones();
  const addMilestone = useAddMilestone();
  const toggleMilestone = useToggleMilestone();
  const deleteMilestone = useDeleteMilestone();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addMilestone.mutate(newTitle.trim(), {
      onSuccess: () => {
        setNewTitle("");
        setAdding(false);
        toast.success("Milestone added");
      },
    });
  };

  const pending = milestones?.filter((m) => !m.completed) ?? [];
  const completed = milestones?.filter((m) => m.completed) ?? [];

  return (
    <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            Skill Milestones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Personal achievements to unlock</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder='e.g. "Complete 1 hike at 3000 ft elevation"'
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || addMilestone.isPending}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border">
          {pending.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 group">
              <button
                onClick={() => toggleMilestone.mutate({ id: m.id, completed: true })}
                className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
              >
                <Circle className="h-4 w-4 text-muted-foreground" />
                {m.title}
              </button>
              <button
                onClick={() => deleteMilestone.mutate(m.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {completed.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 group">
              <button
                onClick={() => toggleMilestone.mutate({ id: m.id, completed: false })}
                className="flex items-center gap-2.5 text-sm text-muted-foreground line-through hover:text-foreground transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {m.title}
              </button>
              <button
                onClick={() => deleteMilestone.mutate(m.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {pending.length === 0 && completed.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">No milestones yet. Add your first one!</p>
          )}
        </div>
      )}
    </div>
  );
}
