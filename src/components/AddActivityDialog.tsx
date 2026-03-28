import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddActivity } from "@/hooks/useActivities";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "hiking", emoji: "🥾", label: "Hiking" },
  { value: "kayaking", emoji: "🛶", label: "Kayaking" },
  { value: "xc_skiing", emoji: "⛷️", label: "XC Skiing" },
  { value: "peloton", emoji: "🚴", label: "Peloton" },
  { value: "orange_theory", emoji: "🏋️", label: "OrangeTheory" },
] as const;

type ActivityType = (typeof ACTIVITY_OPTIONS)[number]["value"];

export default function AddActivityDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActivityType>("hiking");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const addActivity = useAddActivity();

  const isMileActivity = ["kayaking", "hiking", "xc_skiing"].includes(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duration || Number(duration) <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }
    try {
      await addActivity.mutateAsync({
        type,
        start_time: new Date().toISOString(),
        duration: Number(duration),
        distance: distance ? Number(distance) : null,
        calories: calories ? Number(calories) : null,
        intensity: "moderate",
        notes: notes.trim() || null,
        elevation_gain: null,
        route: null,
      });
      toast.success("Activity logged! 🎉");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to log activity");
    }
  };

  const resetForm = () => {
    setType("hiking");
    setDuration("");
    setDistance("");
    setCalories("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-elevated">
          <Plus className="h-5 w-5" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs transition-all border ${
                  type === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (min)*</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                required
                min={1}
                max={600}
              />
            </div>
            {isMileActivity && (
              <div className="space-y-1.5">
                <Label htmlFor="distance">Distance (miles)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="5.0"
                  min={0}
                  max={200}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="400"
                min={0}
                max={10000}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go?"
              maxLength={500}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={addActivity.isPending}>
            {addActivity.isPending ? "Saving..." : "Log Activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
