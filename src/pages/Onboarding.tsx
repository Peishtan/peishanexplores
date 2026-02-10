import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Target, Footprints, Dumbbell, Flame } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [goalWeight, setGoalWeight] = useState("");
  const [goalSteps, setGoalSteps] = useState("10000");
  const [goalWorkouts, setGoalWorkouts] = useState("3");
  const [goalCalories, setGoalCalories] = useState("500");
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Weight Goal",
      description: "What's your target weight? (optional)",
      content: (
        <div className="space-y-2">
          <Label htmlFor="weight">Target weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            placeholder="70"
            min={20}
            max={300}
          />
        </div>
      ),
    },
    {
      icon: <Footprints className="h-8 w-8" />,
      title: "Daily Steps",
      description: "How many steps do you want to hit daily?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="steps">Daily steps goal</Label>
          <Input
            id="steps"
            type="number"
            value={goalSteps}
            onChange={(e) => setGoalSteps(e.target.value)}
            placeholder="10000"
            min={1000}
            max={50000}
          />
        </div>
      ),
    },
    {
      icon: <Dumbbell className="h-8 w-8" />,
      title: "Workouts",
      description: "How many workouts per week?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="workouts">Workouts per week</Label>
          <Input
            id="workouts"
            type="number"
            value={goalWorkouts}
            onChange={(e) => setGoalWorkouts(e.target.value)}
            placeholder="3"
            min={1}
            max={14}
          />
        </div>
      ),
    },
    {
      icon: <Flame className="h-8 w-8" />,
      title: "Calorie Goal",
      description: "Daily calorie burn target",
      content: (
        <div className="space-y-2">
          <Label htmlFor="calories">Daily calories goal</Label>
          <Input
            id="calories"
            type="number"
            value={goalCalories}
            onChange={(e) => setGoalCalories(e.target.value)}
            placeholder="500"
            min={100}
            max={5000}
          />
        </div>
      ),
    },
  ];

  const handleFinish = async () => {
    try {
      await updateProfile.mutateAsync({
        goal_weight: goalWeight ? Number(goalWeight) : null,
        goal_steps: Number(goalSteps) || 10000,
        goal_workouts_per_week: Number(goalWorkouts) || 3,
        goal_calories: Number(goalCalories) || 500,
        onboarding_completed: true,
      });
      toast.success("Goals saved! Let's go 💪");
      navigate("/");
    } catch {
      toast.error("Failed to save goals");
    }
  };

  const currentStep = steps[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Step {step + 1} of {steps.length}</p>
          <div className="flex gap-1.5 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {currentStep.icon}
            </div>
            <CardTitle>{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep.content}
            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="flex-1">
                  Next
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={updateProfile.isPending} className="flex-1">
                  {updateProfile.isPending ? "Saving..." : "Start Tracking"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
