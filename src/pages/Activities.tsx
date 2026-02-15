import { useState } from "react";
import { useActivities, useDeleteActivity, Activity } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { format } from "date-fns";
import { Trash2, Edit2, Plus, Loader2, Waves, Footprints, Snowflake, Dumbbell } from "lucide-react";
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
  { id: "kayaking" as const, label: "Kayak", icon: Waves },
  { id: "hiking" as const, label: "Hike", icon: Footprints },
  { id: "xc_skiing" as const, label: "XC Ski", icon: Snowflake },
  { id: "orange_theory" as const, label: "Gym", icon: Dumbbell },
  { id: "peloton" as const, label: "Gym", icon: Dumbbell },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "kayaking", label: "Kayak" },
  { id: "hiking", label: "Hike" },
  { id: "xc_skiing", label: "XC Ski" },
  { id: "gym", label: "Gym" },
];

const DATE_RANGES = [
  { id: "30", label: "Last 30 Days" },
  { id: "90", label: "Last 90 Days" },
  { id: "365", label: "This Year" },
  { id: "all", label: "All Time" },
];

type ActivityType = "kayaking" | "hiking" | "xc_skiing" | "orange_theory" | "peloton";

interface LogForm {
  route: string;
  date: string;
  miles: string;
  elevation: string;
  notes: string;
  sport: ActivityType;
}

function getSportInfo(type: string) {
  return SPORTS.find((s) => s.id === type) ?? SPORTS[0];
}

export default function Activities() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [form, setForm] = useState<LogForm>({
    route: "", date: new Date().toISOString().split("T")[0], miles: "", elevation: "", notes: "", sport: "hiking",
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

  // Filter activities
  const now = new Date();
  const filtered = activities
    ?.filter((a) => {
      // Sport filter
      if (sportFilter === "gym") {
        if (!["peloton", "orange_theory"].includes(a.type)) return false;
      } else if (sportFilter !== "all" && a.type !== sportFilter) {
        return false;
      }
      // Date range filter
      if (dateRange !== "all") {
        const days = parseInt(dateRange);
        const cutoff = new Date(now.getTime() - days * 86400000);
        if (new Date(a.start_time) < cutoff) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">PS FitTrackr</h1>
        </header>

        {/* Hero Banner */}
        <HeroBanner title="Logs" />

        {/* Action button */}
        <div className="flex justify-end">
          <Button onClick={openAdd} size="sm" className="gap-1.5 rounded-xl">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSportFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  sportFilter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs font-medium rounded-lg border border-border bg-card px-3 py-1.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Micro Stats */}
        {!isLoading && filtered && filtered.length > 0 && (() => {
          const hikeCount = filtered.filter(a => a.type === "hiking").length;
          const skiCount = filtered.filter(a => a.type === "xc_skiing").length;
          const kayakCount = filtered.filter(a => a.type === "kayaking").length;
          const gymCount = filtered.filter(a => ["peloton", "orange_theory"].includes(a.type)).length;
          const totalMiles = filtered.reduce((s, a) => s + (a.distance ?? 0), 0);
          const totalElev = filtered.reduce((s, a) => s + (a.elevation_gain ?? 0), 0);

          const parts: string[] = [];
          if (hikeCount > 0) parts.push(`${hikeCount} hike${hikeCount > 1 ? "s" : ""}`);
          if (kayakCount > 0) parts.push(`${kayakCount} paddle${kayakCount > 1 ? "s" : ""}`);
          if (skiCount > 0) parts.push(`${skiCount} ski${skiCount > 1 ? "s" : ""}`);
          if (gymCount > 0) parts.push(`${gymCount} gym`);
          if (totalMiles > 0) parts.push(`${totalMiles % 1 === 0 ? totalMiles : totalMiles.toFixed(1)} mi`);
          if (totalElev > 0) parts.push(`${totalElev.toLocaleString()} ft`);

          const rangeLabel = DATE_RANGES.find(r => r.id === dateRange)?.label ?? "";

          return (
            <p className="text-xs text-muted-foreground font-medium">
              {rangeLabel}: {parts.join(" • ")}
            </p>
          );
        })()}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="px-4 py-3 font-medium">Route / Activity</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Miles</th>
                  <th className="px-4 py-3 font-medium">Elevation</th>
                  <th className="px-4 py-3 font-medium">Sport</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Notes</th>
                  <th className="px-4 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm italic">
                      No activities found.
                    </td>
                  </tr>
                )}
                {filtered?.map((a) => {
                  const sport = getSportInfo(a.type);
                  const Icon = sport.icon;
                  return (
                    <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          {(a as any).route || sport.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(a.start_time), "EEE, MMM d")}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {a.distance ? `${a.distance} mi` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {a.elevation_gain ? `${a.elevation_gain.toLocaleString()} ft` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {sport.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate hidden md:table-cell">
                        {a.notes || ""}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(a)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
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
              <Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="e.g. Si Mount Hiking" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Miles</Label>
                <Input type="number" step="0.1" value={form.miles} onChange={(e) => setForm({ ...form, miles: e.target.value })} placeholder="0.0" />
              </div>
            </div>
            {["hiking", "xc_skiing", "kayaking"].includes(form.sport) && (
              <div className="space-y-1.5">
                <Label>Elevation Gain (ft)</Label>
                <Input type="number" value={form.elevation} onChange={(e) => setForm({ ...form, elevation: e.target.value })} placeholder="e.g. 1200" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Sport Type</Label>
              <select
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value as ActivityType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="kayaking">Kayak</option>
                <option value="hiking">Hike</option>
                <option value="xc_skiing">XC Ski</option>
                <option value="orange_theory">Orange Theory</option>
                <option value="peloton">Peloton</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." rows={3} />
            </div>
            <Button type="submit" className="w-full">{editingId ? "Update Entry" : "Save Entry"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
