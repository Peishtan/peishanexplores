import { useState } from "react";
import { useActivities, useDeleteActivity, useAddActivity, Activity, MILE_ACTIVITIES } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const SPORTS = [
  { id: "kayaking" as const, label: "Kayaking", color: "#c92a32" },
  { id: "hiking" as const, label: "Hiking", color: "#278737" },
  { id: "xc_skiing" as const, label: "XC Skiing", color: "#2a6dc9" },
  { id: "orange_theory" as const, label: "Orange Theory", color: "#ef4444" },
  { id: "peloton" as const, label: "Peloton", color: "#ec4899" },
];

type ActivityType = (typeof SPORTS)[number]["id"];

interface LogForm {
  route: string;
  date: string;
  miles: string;
  elevation: string;
  notes: string;
  sport: ActivityType;
}

export default function Activities() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();
  const addActivity = useAddActivity();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LogForm>({
    route: "",
    date: new Date().toISOString().split("T")[0],
    miles: "",
    elevation: "",
    notes: "",
    sport: "hiking",
  });

  const resetForm = () => {
    setForm({ route: "", date: new Date().toISOString().split("T")[0], miles: "", elevation: "", notes: "", sport: "hiking" });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (a: Activity) => {
    setEditingId(a.id);
    setForm({
      route: (a as any).route || "",
      date: new Date(a.start_time).toISOString().split("T")[0],
      miles: a.distance?.toString() || "",
      elevation: a.elevation_gain?.toString() || "",
      notes: a.notes || "",
      sport: a.type,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const [year, month, day] = form.date.split("-").map(Number);
      const localDate = new Date(year, month - 1, day);
      if (editingId) {
        const { error } = await supabase
          .from("activities")
          .update({
            route: form.route || null,
            type: form.sport,
            start_time: localDate.toISOString(),
            distance: form.miles ? parseFloat(form.miles) : null,
            elevation_gain: form.elevation ? parseInt(form.elevation) : null,
            notes: form.notes || null,
          })
          .eq("id", editingId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["activities"] });
        toast.success("Activity updated");
      } else {
        const { error } = await supabase
          .from("activities")
          .insert({
            type: form.sport,
            start_time: localDate.toISOString(),
            duration: 0,
            distance: form.miles ? parseFloat(form.miles) : null,
            elevation_gain: form.elevation ? parseInt(form.elevation) : null,
            calories: null,
            intensity: "moderate" as const,
            notes: form.notes || null,
            route: form.route || null,
            user_id: user!.id,
          });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["activities"] });
        toast.success("Activity logged! 🎉");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save activity");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity.mutateAsync(id);
      toast.success("Activity deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-sm">
                  <th className="p-4 font-medium">Route / Activity</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Miles</th>
                  <th className="p-4 font-medium">Sport</th>
                  <th className="p-4 font-medium hidden md:table-cell">Notes</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activities?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                      No activities logged yet. Click "Add Entry" to start.
                    </td>
                  </tr>
                )}
                {activities?.slice().sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).map((a) => {
                  const sport = SPORTS.find((s) => s.id === a.type);
                  return (
                    <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium text-foreground">{(a as any).route || "—"}</td>
                      <td className="p-4 text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(a.start_time), "MMM d, yyyy")}
                      </td>
                      <td className="p-4 font-mono text-foreground">{a.distance || "—"}</td>
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-tighter inline-flex items-center gap-1"
                          style={{ backgroundColor: (sport?.color || "#888") + "20", color: sport?.color }}
                        >
                          {sport?.label || a.type}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm max-w-xs truncate hidden md:table-cell">
                        {a.notes || ""}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(a)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Activity" : "Log Activity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Route / Class Name</Label>
              <Input
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                placeholder="e.g. Si Mount Hiking"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Miles</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.miles}
                  onChange={(e) => setForm({ ...form, miles: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>
            {["hiking", "xc_skiing"].includes(form.sport) && (
              <div className="space-y-1.5">
                <Label>Elevation Gain (ft)</Label>
                <Input
                  type="number"
                  value={form.elevation}
                  onChange={(e) => setForm({ ...form, elevation: e.target.value })}
                  placeholder="e.g. 1200"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Sport Type</Label>
              <select
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value as ActivityType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SPORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingId ? "Update Entry" : "Save Entry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
