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
  const [goalSteps, setGoalSteps] = useState("");
  const [goalWorkouts, setGoalWorkouts] = useState("");
  const [goalCalories, setGoalCalories] = useState("");
  const [goalMinutes, setGoalMinutes] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setGoalWeight(profile.goal_weight?.toString() || "");
      setGoalSteps(profile.goal_steps?.toString() || "10000");
      setGoalWorkouts(profile.goal_workouts_per_week?.toString() || "3");
      setGoalCalories(profile.goal_calories?.toString() || "500");
      setGoalMinutes(profile.goal_active_minutes?.toString() || "30");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: name.trim() || null,
        goal_weight: goalWeight ? Number(goalWeight) : null,
        goal_steps: Number(goalSteps) || 10000,
        goal_workouts_per_week: Number(goalWorkouts) || 3,
        goal_calories: Number(goalCalories) || 500,
        goal_active_minutes: Number(goalMinutes) || 30,
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
            <CardTitle className="text-base">Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-weight">Target Weight (kg)</Label>
                <Input id="s-weight" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} min={20} max={300} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-steps">Daily Steps</Label>
                <Input id="s-steps" type="number" value={goalSteps} onChange={(e) => setGoalSteps(e.target.value)} min={1000} max={50000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-workouts">Workouts/Week</Label>
                <Input id="s-workouts" type="number" value={goalWorkouts} onChange={(e) => setGoalWorkouts(e.target.value)} min={1} max={14} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-cals">Daily Calories</Label>
                <Input id="s-cals" type="number" value={goalCalories} onChange={(e) => setGoalCalories(e.target.value)} min={100} max={5000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-mins">Active Minutes</Label>
                <Input id="s-mins" type="number" value={goalMinutes} onChange={(e) => setGoalMinutes(e.target.value)} min={10} max={300} />
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
