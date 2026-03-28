import { useActivityHeatmap, getSportColor } from "@/hooks/useActivityHeatmap";
import { Activity } from "@/hooks/useActivities";
import { format } from "date-fns";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface ActivityHeatmapProps {
  activities: Activity[] | undefined;
  sportFilter: string;
}

export default function ActivityHeatmap({ activities, sportFilter }: ActivityHeatmapProps) {
  const { weeks } = useActivityHeatmap(activities);

  if (weeks.length === 0) return null;

  return (
    <div className="px-4 pt-5">
      <div className="bg-card border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3.5">
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 flex-shrink-0">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="font-mono-dm text-[7px] text-fog/40 w-3 h-[18px] flex items-center justify-end">
                {i % 2 === 0 ? label : ""}
              </span>
            ))}
          </div>
          {/* Week columns */}
          {weeks.map((week) => (
            <div key={week.weekNum} className="flex flex-col gap-[3px] flex-1">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const day = week.days[dayIdx];
                if (!day) {
                  return <div key={dayIdx} className="h-[18px] rounded-[3px]" />;
                }

                // Filter logic
                const filteredTypes = sportFilter === "all"
                  ? day.types
                  : sportFilter === "gym"
                    ? day.types.filter(t => ["peloton", "orange_theory"].includes(t))
                    : day.types.filter(t => t === sportFilter);

                const count = filteredTypes.length;
                const color = count > 0 ? getSportColor(filteredTypes) : undefined;
                const opacity = count === 0 ? 0.06 : count === 1 ? 0.6 : count >= 2 ? 1 : 0.8;
                const isToday = format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                return (
                  <div
                    key={dayIdx}
                    className={`h-[18px] rounded-[3px] transition-all ${isToday ? "ring-1 ring-moss-light/50" : ""}`}
                    style={{
                      backgroundColor: color ?? "rgba(255,255,255,0.06)",
                      opacity: count > 0 ? opacity : 1,
                    }}
                    title={`${format(day.date, "MMM d")}${count > 0 ? ` · ${count} activit${count > 1 ? "ies" : "y"}` : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Week numbers */}
        <div className="flex gap-[3px] mt-1.5 ml-4">
          {weeks.map((week) => (
            <span key={week.weekNum} className="font-mono-dm text-[7px] text-fog/30 flex-1 text-center">
              {week.weekNum % 2 === 1 ? `W${week.weekNum}` : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}