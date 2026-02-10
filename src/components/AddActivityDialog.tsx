import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddActivity } from "@/hooks/useActivities";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AddActivityDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"walk" | "run" | "cycle" | "gym">("walk");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [intensity, setIntensity] = useState<"low" | "moderate" | "high" | "extreme">("moderate");
  const [notes, setNotes] = useState("");
  const addActivity = useAddActivity();

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
        intensity,
        notes: notes.trim() || null,
      });
      toast.success("Activity logged! 🎉");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to log activity");
    }
  };

  const resetForm = () => {
    setType("walk");
    setDuration("");
    setDistance("");
    setCalories("");
    setIntensity("moderate");
    setNotes("");
  };

  const activityEmojis = { walk: "🚶", run: "🏃", cycle: "🚴", gym: "🏋️" };

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
          <div className="grid grid-cols-4 gap-2">
            {(["walk", "run", "cycle", "gym"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-sm transition-all border ${
                  type === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-xl">{activityEmojis[t]}</span>
                <span className="capitalize">{t}</span>
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
                placeholder="30"
                required
                min={1}
                max={600}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="distance">Distance (km)</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="250"
                min={0}
                max={10000}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intensity">Intensity</Label>
              <Select value={intensity} onValueChange={(v) => setIntensity(v as any)}>
                <SelectTrigger id="intensity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
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
