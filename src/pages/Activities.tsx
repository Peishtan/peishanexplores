import { useState } from "react";
import { useActivities, useDeleteActivity, Activity } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { format } from "date-fns";
import { Trash2, Edit2, Plus, Loader2, Waves, Footprints, Snowflake, Dumbbell } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const SPORTS = [
  { id: "kayaking" as const, label: "Kayak", icon: Waves, pillClass: "bg-[rgba(100,160,210,0.15)] text-[#7ab4d4] border-[rgba(100,160,210,0.25)]" },
  { id: "hiking" as const, label: "Hike", icon: Footprints, pillClass: "bg-[rgba(122,184,124,0.15)] text-moss-light border-[rgba(122,184,124,0.25)]" },
  { id: "xc_skiing" as const, label: "XC Ski", icon: Snowflake, pillClass: "bg-[rgba(180,180,220,0.15)] text-[#b0b4e0] border-[rgba(180,180,220,0.25)]" },
  { id: "orange_theory" as const, label: "Gym", icon: Dumbbell, pillClass: "bg-[rgba(212,150,58,0.15)] text-amber border-[rgba(212,150,58,0.25)]" },
  { id: "peloton" as const, label: "Gym", icon: Dumbbell, pillClass: "bg-[rgba(212,150,58,0.15)] text-amber border-[rgba(212,150,58,0.25)]" },
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

  // Summary stats
  const hikeCount = filtered?.filter(a => a.type === "hiking").length ?? 0;
  const kayakCount = filtered?.filter(a => a.type === "kayaking").length ?? 0;
  const skiCount = filtered?.filter(a => a.type === "xc_skiing").length ?? 0;
  const gymCount = filtered?.filter(a => ["peloton", "orange_theory"].includes(a.type)).length ?? 0;
  const totalMiles = filtered?.reduce((s, a) => s + (a.distance ?? 0), 0) ?? 0;
  const totalElev = filtered?.reduce((s, a) => s + (a.elevation_gain ?? 0), 0) ?? 0;

  const chips: string[] = [];
  if (hikeCount > 0) chips.push(`${hikeCount} hike${hikeCount > 1 ? "s" : ""}`);
  if (kayakCount > 0) chips.push(`${kayakCount} paddle${kayakCount > 1 ? "s" : ""}`);
  if (skiCount > 0) chips.push(`${skiCount} ski${skiCount > 1 ? "s" : ""}`);
  if (gymCount > 0) chips.push(`${gymCount} gym`);
  if (totalMiles > 0) chips.push(`${totalMiles % 1 === 0 ? totalMiles : totalMiles.toFixed(1)} mi`);
  if (totalElev > 0) chips.push(`${totalElev.toLocaleString()} ft`);

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner title="Logs" subtitle="Activity history" compact />

      <div className="mx-auto max-w-[420px]">
        {/* Summary Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-5">
            {chips.map((chip, i) => (
              <span key={i} className="font-mono-dm text-[11px] tracking-[0.08em] text-mist bg-card border border-[rgba(255,255,255,0.07)] px-2.5 py-1 rounded-full">
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 px-4 pt-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSportFilter(f.id)}
              className={`font-mono-dm text-[11px] tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-all ${
                sportFilter === f.id
                  ? "bg-moss text-paper border-moss-light"
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

        {/* Section Label */}
        <div className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-fog px-6 mt-6 mb-3">
          {DATE_RANGES.find(r => r.id === dateRange)?.label ?? "Activities"}
        </div>

        {/* Log List */}
        <div className="px-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-moss-light" />
            </div>
          ) : filtered?.length === 0 ? (
            <p className="font-mono-dm text-xs text-[rgba(255,255,255,0.12)] italic text-center py-8">
              No activities found.
            </p>
          ) : (
            filtered?.map((a) => {
              const sport = getSportInfo(a.type);
              return (
                <div key={a.id} className="bg-card border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3.5 flex items-center gap-3.5 hover:border-[rgba(255,255,255,0.14)] transition-colors group">
                  <span className={`font-mono-dm text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded-md border flex-shrink-0 w-[52px] text-center ${sport.pillClass}`}>
                    {sport.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[15px] font-bold leading-tight truncate">
                      {(a as any).route || sport.label}
                    </p>
                    <p className="font-mono-dm text-[10px] text-fog mt-0.5 tracking-[0.06em]">
                      {format(new Date(a.start_time), "EEE, MMM d")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {a.distance ? (
                      <span className="font-display text-[17px] font-bold leading-none">{a.distance}</span>
                    ) : null}
                    {a.elevation_gain ? (
                      <span className="font-mono-dm text-[10px] text-fog">{a.elevation_gain.toLocaleString()} ft</span>
                    ) : null}
                  </div>
                  {/* Edit/Delete on hover */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openEdit(a)} className="text-fog hover:text-moss-light transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="text-fog hover:text-amber transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="h-24" />
        </div>{/* end right column */}
        </div>{/* end grid */}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-[84px] right-[calc(50%-190px)] w-[52px] h-[52px] rounded-full bg-moss-light text-ink text-[28px] font-light flex items-center justify-center z-[90] hover:scale-105 transition-transform"
        style={{ boxShadow: '0 4px 20px rgba(122,184,124,0.35)' }}
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
                <option value="kayaking">Kayak</option>
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

      <BottomNav />
    </div>
  );
}
