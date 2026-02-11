import { useState } from "react";
import {
  useBenchmarks, useAddBenchmark, useUpdateBenchmark, useDeleteBenchmark,
  BENCHMARK_TYPES, BenchmarkTypeId, parseResultToNumber, formatSecondsToTime,
} from "@/hooks/useBenchmarks";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label as ReLabel,
} from "recharts";

export default function Benchmarks() {
  const { data: benchmarks, isLoading } = useBenchmarks();
  const addBenchmark = useAddBenchmark();
  const updateBenchmark = useUpdateBenchmark();
  const deleteBenchmark = useDeleteBenchmark();

  const [selectedType, setSelectedType] = useState<BenchmarkTypeId>("500m_row");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    testId: "500m_row" as BenchmarkTypeId,
    result: "",
    notes: "",
  });

  const activeTest = BENCHMARK_TYPES.find((t) => t.id === selectedType)!;

  const filtered = benchmarks?.filter((b) => b.test_id === selectedType) ?? [];
  const trendData = filtered.map((b) => ({
    date: format(new Date(b.date), "MMM d"),
    value: parseResultToNumber(b.result, activeTest.unit),
    original: b.result,
  }));

  const openAdd = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split("T")[0], testId: selectedType, result: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (b: any) => {
    setEditingId(b.id);
    setForm({ date: b.date, testId: b.test_id, result: b.result, notes: b.notes || "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.result) { toast.error("Result is required"); return; }
    try {
      if (editingId) {
        await updateBenchmark.mutateAsync({ id: editingId, date: form.date, result: form.result, notes: form.notes || undefined });
        toast.success("Benchmark updated");
      } else {
        await addBenchmark.mutateAsync({ test_id: form.testId, date: form.date, result: form.result, notes: form.notes || undefined });
        toast.success("Benchmark recorded! 💪");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save benchmark");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBenchmark.mutateAsync(id);
      toast.success("Benchmark deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-5xl px-4 pt-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Performance Benchmarks</h1>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> New Test
          </Button>
        </div>

        <div className="rounded-2xl bg-card p-6 border border-border shadow-card space-y-8">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {BENCHMARK_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedType === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Trend Chart */}
          <div className="h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 30, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (activeTest.unit === "time" ? formatSecondsToTime(val) : String(val))}
                  >
                    <ReLabel
                      value={activeTest.unit === "time" ? "Time (MM:SS)" : "Reps"}
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: "middle", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                  </YAxis>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [
                      activeTest.unit === "time" ? formatSecondsToTime(value) : value,
                      "Result",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">
                No data points for this test yet.
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-sm">
                  <th className="pb-4 font-medium">Benchmark</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">{activeTest.unit === "time" ? "Time" : "Reps"}</th>
                  <th className="pb-4 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground italic">
                      No history recorded for this benchmark.
                    </td>
                  </tr>
                )}
                {[...filtered]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 font-medium text-primary">
                        {BENCHMARK_TYPES.find((t) => t.id === b.test_id)?.label}
                      </td>
                      <td className="py-4 text-muted-foreground text-sm">
                        {format(new Date(b.date), "MMM d, yyyy")}
                      </td>
                      <td className="py-4 font-mono font-bold text-foreground">{b.result}</td>
                      <td className="py-4 text-right pr-4">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => openEdit(b)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Benchmark" : "Record Benchmark"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <div className="space-y-1.5">
                <Label>Test Type</Label>
                <select
                  value={form.testId}
                  onChange={(e) => setForm({ ...form, testId: e.target.value as BenchmarkTypeId })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {BENCHMARK_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {BENCHMARK_TYPES.find((t) => t.id === form.testId)?.unit === "time" ? "Result (Time)" : "Result (Reps)"}
                </Label>
                <Input
                  required
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  placeholder={
                    BENCHMARK_TYPES.find((t) => t.id === form.testId)?.unit === "time" ? "e.g. 7:14.2" : "e.g. 45"
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes..."
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingId ? "Update Benchmark" : "Save Benchmark"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
