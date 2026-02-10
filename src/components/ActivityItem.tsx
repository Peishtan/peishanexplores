import { Activity } from "@/hooks/useActivities";
import { format } from "date-fns";
import { Clock, Flame, MapPin } from "lucide-react";

const activityEmojis: Record<string, string> = { walk: "🚶", run: "🏃", cycle: "🚴", gym: "🏋️" };
const intensityColors: Record<string, string> = {
  low: "bg-chart-2/15 text-chart-2",
  moderate: "bg-primary/15 text-primary",
  high: "bg-accent/15 text-accent",
  extreme: "bg-destructive/15 text-destructive",
};

export default function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card p-4 border border-border shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
        {activityEmojis[activity.type] || "🏃"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold capitalize text-foreground">{activity.type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColors[activity.intensity]}`}>
            {activity.intensity}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {activity.duration}m
          </span>
          {activity.distance && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {activity.distance}km
            </span>
          )}
          {activity.calories && (
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {activity.calories}cal
            </span>
          )}
        </div>
        {activity.notes && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{activity.notes}</p>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {format(new Date(activity.start_time), "h:mm a")}
      </div>
    </div>
  );
}
