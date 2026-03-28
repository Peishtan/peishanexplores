import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Target, Dumbbell, Mountain, Ship } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [goalWeight, setGoalWeight] = useState("");
  const [goalExercises, setGoalExercises] = useState("3");
  const [goalOutdoor, setGoalOutdoor] = useState("2");
  const [goalKayak, setGoalKayak] = useState("1");
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Weight Goal",
      description: "What's your target weight? (optional)",
      content: (
        <div className="space-y-2">
          <Label htmlFor="weight">Target weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            placeholder="170"
            min={50}
            max={500}
          />
        </div>
      ),
    },
    {
      icon: <Dumbbell className="h-8 w-8" />,
      title: "Exercises / Week",
      description: "Peloton or OrangeTheory sessions per week?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="exercises">Exercises per week</Label>
          <Input
            id="exercises"
            type="number"
            value={goalExercises}
            onChange={(e) => setGoalExercises(e.target.value)}
            placeholder="3"
            min={1}
            max={14}
          />
        </div>
      ),
    },
    {
      icon: <Mountain className="h-8 w-8" />,
      title: "Outdoor Miles",
      description: "Hikes or XC ski sessions per week?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="outdoor">Hike / XC Ski per week</Label>
          <Input
            id="outdoor"
            type="number"
            value={goalOutdoor}
            onChange={(e) => setGoalOutdoor(e.target.value)}
            placeholder="2"
            min={0}
            max={14}
          />
        </div>
      ),
    },
    {
      icon: <Ship className="h-8 w-8" />,
      title: "Paddling",
      description: "Paddle sessions per week?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="kayak">Paddling per week</Label>
          <Input
            id="kayak"
            type="number"
            value={goalKayak}
            onChange={(e) => setGoalKayak(e.target.value)}
            placeholder="1"
            min={0}
            max={14}
          />
        </div>
      ),
    },
  ];

  const handleFinish = async () => {
    try {
      await updateProfile.mutateAsync({
        goal_weight: goalWeight ? Number(goalWeight) : null,
        goal_exercises_per_week: Number(goalExercises) || 3,
        goal_outdoor_per_week: Number(goalOutdoor) || 2,
        goal_kayak_per_week: Number(goalKayak) || 1,
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
