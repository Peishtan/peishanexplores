import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { LogOut, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalExercises, setGoalExercises] = useState("");
  const [goalOutdoor, setGoalOutdoor] = useState("");
  const [goalKayak, setGoalKayak] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setGoalWeight(profile.goal_weight?.toString() || "");
      setGoalExercises(profile.goal_exercises_per_week?.toString() || "3");
      setGoalOutdoor(profile.goal_outdoor_per_week?.toString() || "2");
      setGoalKayak(profile.goal_kayak_per_week?.toString() || "1");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: name.trim() || null,
        goal_weight: goalWeight ? Number(goalWeight) : null,
        goal_exercises_per_week: Number(goalExercises) || 3,
        goal_outdoor_per_week: Number(goalOutdoor) || 2,
        goal_kayak_per_week: Number(goalKayak) || 1,
      });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Display Name</Label>
              <Input
                id="s-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Weekly Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-weight">Target Weight (lbs)</Label>
                <Input id="s-weight" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} min={50} max={500} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-exercises">Exercises/Week</Label>
                <Input id="s-exercises" type="number" value={goalExercises} onChange={(e) => setGoalExercises(e.target.value)} min={1} max={14} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-outdoor">Hike+XC Ski/Week</Label>
                <Input id="s-outdoor" type="number" value={goalOutdoor} onChange={(e) => setGoalOutdoor(e.target.value)} min={0} max={14} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-kayak">Kayaking/Week</Label>
                <Input id="s-kayak" type="number" value={goalKayak} onChange={(e) => setGoalKayak(e.target.value)} min={0} max={14} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full gap-2" disabled={updateProfile.isPending}>
          <Save className="h-4 w-4" />
          {updateProfile.isPending ? "Saving..." : "Save Settings"}
        </Button>

        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={async () => {
            await signOut();
            toast.success("Signed out");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
