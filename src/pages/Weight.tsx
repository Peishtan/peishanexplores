import { useState } from "react";
import { useWeightEntries, useAddWeightEntry, useDeleteWeightEntry } from "@/hooks/useWeightEntries";
import { useProfile } from "@/hooks/useProfile";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { Plus, Trash2, Loader2, Scale } from "lucide-react";
import { toast } from "sonner";

export default function Weight() {
  const { data: entries, isLoading } = useWeightEntries();
  const { data: profile } = useProfile();
  const addEntry = useAddWeightEntry();
  const deleteEntry = useDeleteWeightEntry();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || Number(weight) <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    try {
      await addEntry.mutateAsync({ date, weight: Number(weight) });
      toast.success("Weight logged!");
      setOpen(false);
      setWeight("");
    } catch {
      toast.error("Failed to log weight");
    }
  };

  const chartData = entries?.map((e) => ({
    date: format(new Date(e.date), "MMM d"),
    weight: Number(e.weight),
  })) || [];

  const latestWeight = entries?.length ? Number(entries[entries.length - 1].weight) : null;
  const firstWeight = entries?.length ? Number(entries[0].weight) : null;
  const change = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Weight</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Log Weight</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="w-date">Date</Label>
                  <Input
                    id="w-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w-weight">Weight (kg)</Label>
                  <Input
                    id="w-weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70.5"
                    required
                    min={20}
                    max={400}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addEntry.isPending}>
                  {addEntry.isPending ? "Saving..." : "Save"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-xl font-bold text-foreground">{latestWeight ?? "—"}</p>
              <p className="text-xs text-muted-foreground">kg</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Goal</p>
              <p className="text-xl font-bold text-foreground">{profile?.goal_weight ?? "—"}</p>
              <p className="text-xs text-muted-foreground">kg</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Change</p>
              <p className={`text-xl font-bold ${change && change < 0 ? "text-primary" : change && change > 0 ? "text-destructive" : "text-foreground"}`}>
                {change !== null ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">kg</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length >= 2 ? (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {profile?.goal_weight && (
                    <ReferenceLine
                      y={Number(profile.goal_weight)}
                      stroke="hsl(var(--accent))"
                      strokeDasharray="5 5"
                      label={{ value: "Goal", fill: "hsl(var(--accent))", fontSize: 11 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Scale className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Log at least 2 entries to see your chart</p>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <h2 className="text-lg font-semibold text-foreground">History</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-2">
            {[...entries].reverse().map((e) => (
              <div
                key={e.id}
                className="group flex items-center justify-between rounded-xl bg-card p-4 border border-border shadow-card"
              >
                <div>
                  <p className="font-medium text-foreground">{Number(e.weight).toFixed(1)} kg</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(e.date), "MMM d, yyyy")}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={async () => {
                    try {
                      await deleteEntry.mutateAsync(e.id);
                      toast.success("Entry deleted");
                    } catch {
                      toast.error("Failed to delete");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <p className="text-muted-foreground">No weight entries yet</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
