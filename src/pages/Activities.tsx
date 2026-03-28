import { useState } from "react";
import { useActivities, useDeleteActivity, Activity } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import HeroBanner from "@/components/HeroBanner";
import { format } from "date-fns";
import { Trash2, Edit2, Plus, Loader2, Waves, Footprints, Snowflake, Dumbbell, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const SPORTS = [
  { id: "kayaking" as const, label: "Paddle", icon: Waves, pillClass: "bg-[rgba(100,160,210,0.15)] text-[#7ab4d4] border-[rgba(100,160,210,0.25)]", accentHex: "#7ab4d4" },
  { id: "hiking" as const, label: "Hike", icon: Footprints, pillClass: "bg-[rgba(77,179,140,0.15)] text-[#4db38c] border-[rgba(77,179,140,0.25)]", accentHex: "#4db38c" },
  { id: "xc_skiing" as const, label: "XC Ski", icon: Snowflake, pillClass: "bg-[rgba(180,180,220,0.15)] text-[#b0b4e0] border-[rgba(180,180,220,0.25)]", accentHex: "#b0b4e0" },
  { id: "orange_theory" as const, label: "Gym", icon: Dumbbell, pillClass: "bg-[rgba(212,106,90,0.15)] text-[#d46a5a] border-[rgba(212,106,90,0.25)]", accentHex: "#d46a5a" },
  { id: "peloton" as const, label: "Gym", icon: Dumbbell, pillClass: "bg-[rgba(212,106,90,0.15)] text-[#d46a5a] border-[rgba(212,106,90,0.25)]", accentHex: "#d46a5a" },
];

const FILTERS = [
  { id: "all", label: "All", activeClass: "bg-moss text-paper border-moss-light" },
  { id: "kayaking", label: "Paddle", activeClass: "bg-[rgba(100,160,210,0.25)] text-[#7ab4d4] border-[rgba(100,160,210,0.5)]" },
  { id: "hiking", label: "Hike", activeClass: "bg-[rgba(77,179,140,0.25)] text-[#4db38c] border-[rgba(77,179,140,0.5)]" },
  { id: "xc_skiing", label: "XC Ski", activeClass: "bg-[rgba(180,180,220,0.25)] text-[#b0b4e0] border-[rgba(180,180,220,0.5)]" },
  { id: "gym", label: "Gym", activeClass: "bg-[rgba(212,106,90,0.25)] text-[#d46a5a] border-[rgba(212,106,90,0.5)]" },
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
  duration: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [form, setForm] = useState<LogForm>({
    route: "", date: new Date().toISOString().split("T")[0], miles: "", elevation: "", duration: "", notes: "", sport: "hiking",
  });

  const resetForm = () => {
    setForm({ route: "", date: new Date().toISOString().split("T")[0], miles: "", elevation: "", duration: "", notes: "", sport: "hiking" });
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
      duration: a.duration > 0 ? a.duration.toString() : "",
      notes: a.notes || "",
      sport: a.type,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
        toast.error("Invalid date format");
        return;
      }
      const [year, month, day] = form.date.split("-").map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        toast.error("Invalid date");
        return;
      }
      const localDate = new Date(year, month - 1, day);

      // Validate numeric fields
      const miles = form.miles ? parseFloat(form.miles) : null;
      if (miles !== null && (isNaN(miles) || miles < 0 || miles > 1000)) {
        toast.error("Distance must be between 0 and 1000 miles");
        return;
      }
      const elevation = form.elevation ? parseInt(form.elevation, 10) : null;
      if (elevation !== null && (isNaN(elevation) || elevation < 0 || elevation > 50000)) {
        toast.error("Elevation must be between 0 and 50,000 ft");
        return;
      }
      const duration = form.duration ? parseInt(form.duration, 10) : 0;
      if (duration < 0 || duration > 1440) {
        toast.error("Duration must be between 0 and 1440 minutes");
        return;
        toast.error("Elevation must be between 0 and 50,000 ft");
        return;
      }

      // Validate text fields
      const route = (form.route || "").trim().slice(0, 500) || null;
      const notes = (form.notes || "").trim().slice(0, 5000) || null;

      // Validate sport type
      const validSports: ActivityType[] = ["kayaking", "hiking", "xc_skiing", "orange_theory", "peloton"];
      if (!validSports.includes(form.sport)) {
        toast.error("Invalid activity type");
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from("activities")
          .update({
            route,
            type: form.sport,
            start_time: localDate.toISOString(),
            distance: miles,
            elevation_gain: elevation,
            duration,
            notes,
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
            distance: miles,
            elevation_gain: elevation,
            calories: null,
            intensity: "moderate" as const,
            notes,
            route,
            user_id: user!.id,
          });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["activities"] });
        toast.success("Activity logged");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save activity");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteActivity.mutateAsync(deleteConfirmId);
      toast.success("Activity deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Filter activities
  const now = new Date();
  const filtered = activities
    ?.filter((a) => {
      if (sportFilter === "gym") {
        if (!["peloton", "orange_theory"].includes(a.type)) return false;
      } else if (sportFilter !== "all" && a.type !== sportFilter) {
        return false;
      }
      if (dateRange !== "all") {
        const days = parseInt(dateRange);
        const cutoff = new Date(now.getTime() - days * 86400000);
        if (new Date(a.start_time) < cutoff) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const downloadCsv = () => {
    if (!filtered?.length) return;
    const headers = ["Date", "Sport", "Route", "Miles", "Elevation (ft)", "Notes"];
    const rows = filtered.map((a) => [
      format(new Date(a.start_time), "yyyy-MM-dd"),
      getSportInfo(a.type).label,
      (a as any).route || "",
      a.distance ?? "",
      a.elevation_gain ?? "",
      (a.notes || "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activities-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner title="Logs" subtitle="Activity history" compact />

      <div className="mx-auto max-w-[420px] md:max-w-[880px] md:px-4">
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-x-6">
          {/* Left: Summary + Filters (sidebar on desktop) */}
          <div className="md:sticky md:top-4 md:self-start">
            {/* Filter Pills */}
            <div className="flex md:flex-wrap gap-2 px-4 pt-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSportFilter(f.id)}
                  className={`font-mono-dm text-[11px] tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-all ${
                    sportFilter === f.id
                      ? f.activeClass
                      : "bg-card text-fog border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="font-mono-dm text-[11px] tracking-[0.1em] uppercase bg-card text-fog border border-[rgba(255,255,255,0.07)] px-3 py-1.5 rounded-full outline-none flex-shrink-0"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Activity Heatmap */}
            <ActivityHeatmap activities={activities} sportFilter={sportFilter} rangeDays={dateRange === "all" ? 90 : parseInt(dateRange)} isCapped={dateRange === "all" || parseInt(dateRange) > 90} />
          </div>

          {/* Right: Log List */}
          <div>
            {/* Section Label */}
            <div className="flex items-center justify-between px-6 md:px-0 mt-6 md:mt-5 mb-3">
              <span className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-fog">
                {DATE_RANGES.find(r => r.id === dateRange)?.label ?? "Activities"}
              </span>
              {filtered && filtered.length > 0 && (
                <button onClick={downloadCsv} className="flex items-center gap-1.5 font-mono-dm text-[10px] uppercase tracking-[0.1em] text-fog hover:text-moss-light transition-colors">
                  <Download className="h-3 w-3" />
                  CSV
                </button>
              )}
            </div>

            {/* Log List */}
            <div className="px-4 md:px-0 space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-moss-light" />
                </div>
              ) : filtered?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Footprints className="h-10 w-10 text-fog/20 mb-3" />
                  <p className="text-sm text-fog mb-1.5">No activities yet</p>
                  <button onClick={openAdd} className="text-sm font-semibold text-moss-light hover:underline">
                    Log your first activity →
                  </button>
                </div>
              ) : (
              filtered?.map((a) => {
                  const sport = getSportInfo(a.type);
                  const isExpanded = expandedId === a.id;
                  return (
                    <div
                      key={a.id}
                      className={`bg-card border rounded-[14px] overflow-hidden transition-colors group ${
                        isExpanded ? "border-[rgba(255,255,255,0.14)]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)]"
                      }`}
                      style={{ borderLeft: `3px solid ${sport.accentHex}` }}
                    >
                      <div
                        className="p-3.5 flex items-center gap-3.5 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      >
                        <span className={`font-mono-dm text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded-md border flex-shrink-0 w-[52px] text-center ${sport.pillClass}`}>
                          {sport.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-[15px] font-bold leading-tight truncate">
                            {a.route || sport.label}
                          </p>
                          <p className="font-mono-dm text-[10px] text-fog mt-0.5 tracking-[0.06em]">
                            {format(new Date(a.start_time), "EEE, MMM d")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          {a.distance ? (
                            <span className="font-display text-[22px] font-black leading-none tracking-tight">{a.distance}</span>
                          ) : null}
                          {a.distance ? (
                            <span className="font-mono-dm text-[9px] text-fog tracking-[0.08em]">mi</span>
                          ) : null}
                          {a.elevation_gain ? (
                            <span className="font-mono-dm text-[10px] text-fog">{a.elevation_gain.toLocaleString()} ft</span>
                          ) : null}
                        </div>
                        {/* Desktop hover actions */}
                        <div className="hidden md:flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="text-fog hover:text-moss-light transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(a.id); }} className="text-fog hover:text-amber transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Mobile expanded actions */}
                      {isExpanded && (
                        <div className="md:hidden flex items-center gap-2 px-3.5 pb-3 pt-0 border-t border-[rgba(255,255,255,0.04)] mt-0 animate-fade-slide-up" style={{ animationDuration: '0.2s' }}>
                          {a.notes && (
                            <p className="text-[11px] text-fog font-light flex-1 truncate">{a.notes}</p>
                          )}
                          {!a.notes && <span className="flex-1" />}
                          <button onClick={() => openEdit(a)} className="flex items-center gap-1.5 text-[10px] font-mono-dm uppercase tracking-[0.1em] text-fog hover:text-moss-light transition-colors px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)]">
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          <button onClick={() => setDeleteConfirmId(a.id)} className="flex items-center gap-1.5 text-[10px] font-mono-dm uppercase tracking-[0.1em] text-fog hover:text-amber transition-colors px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)]">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="h-24" />
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-[96px] right-6 w-[52px] h-[52px] rounded-full bg-moss-light text-ink text-[28px] font-light flex items-center justify-center z-[90] hover:scale-105 transition-transform"
        style={{ boxShadow: '0 4px 20px hsl(var(--moss-light) / 0.35)' }}
      >
        +
      </button>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-[rgba(255,255,255,0.1)]">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Activity" : "Log Activity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-fog">Route / Class Name</Label>
              <Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="e.g. Si Mount Hiking" className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-fog">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-fog">Miles</Label>
                <Input type="number" step="0.1" value={form.miles} onChange={(e) => setForm({ ...form, miles: e.target.value })} placeholder="0.0" className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
              </div>
            </div>
            {["hiking", "xc_skiing", "kayaking"].includes(form.sport) && (
              <div className="space-y-1.5">
                <Label className="text-fog">Elevation Gain (ft)</Label>
                <Input type="number" value={form.elevation} onChange={(e) => setForm({ ...form, elevation: e.target.value })} placeholder="e.g. 1200" className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-fog">Sport Type</Label>
              <select
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value as ActivityType })}
                className="flex h-10 w-full rounded-md bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-sm text-foreground outline-none focus:border-moss-light"
              >
                <option value="kayaking">Paddle</option>
                <option value="hiking">Hike</option>
                <option value="xc_skiing">XC Ski</option>
                <option value="orange_theory">Orange Theory</option>
                <option value="peloton">Peloton</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-fog">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." rows={3} className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
            </div>
            <button type="submit" className="w-full font-mono-dm text-xs tracking-[0.12em] uppercase bg-moss text-paper border-none py-3.5 rounded-xl hover:bg-moss-light hover:text-ink transition-colors">
              {editingId ? "Update Entry" : "Save Entry"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-[rgba(255,255,255,0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription className="text-fog">
              This can't be undone. The activity will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono-dm text-xs tracking-[0.1em] uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="font-mono-dm text-xs tracking-[0.1em] uppercase bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
