import { useActivities, useDeleteActivity } from "@/hooks/useActivities";
import ActivityItem from "@/components/ActivityItem";
import AddActivityDialog from "@/components/AddActivityDialog";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Activities() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity.mutateAsync(id);
      toast.success("Activity deleted");
    } catch {
      toast.error("Failed to delete activity");
    }
  };

  // Group by date
  const grouped = activities?.reduce((acc, a) => {
    const dateKey = format(new Date(a.start_time), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(a);
    return acc;
  }, {} as Record<string, typeof activities>) || {};

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
          <AddActivityDialog />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center shadow-card">
            <p className="text-muted-foreground">No activities logged yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, acts]) => (
            <div key={dateKey} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {format(new Date(dateKey), "EEEE, MMM d")}
              </h3>
              {acts!.map((a) => (
                <div key={a.id} className="group relative">
                  <ActivityItem activity={a} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
