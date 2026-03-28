import { TrendingUp, TrendingDown, CheckCircle2, Target, Flame } from "lucide-react";

interface GoalInsightProps {
  label: string;
  current: number;
  target: number;
  color: string;
  note: string;
  streak: number;
}

export default function GoalInsight({ label, current, target, color, note, streak }: GoalInsightProps) {
  const met = current >= target;
  const percentage = Math.min((current / target) * 100, 100);
  const circumference = 251.2;

  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all duration-500 ${
      met ? "border-primary/30 bg-primary/5" : "border-border bg-card"
    }`}>
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="40" cy="40" r="32"
            strokeWidth="6" fill="transparent"
            className="stroke-muted"
          />
          <circle
            cx="40" cy="40" r="32"
            strokeWidth="6" fill="transparent"
            strokeDasharray={201}
            strokeDashoffset={201 - (201 * percentage) / 100}
            strokeLinecap="round"
            stroke={color}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {met ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <span className="text-lg font-bold text-foreground">{current}/{target}</span>
          )}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{met ? `${current}/${target} ✔` : `${current}/${target}`}</p>
        <p className="text-xs font-medium" style={{ color }}>{note}</p>
        {streak > 1 && (
          <p className="text-[10px] text-accent font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="h-3 w-3" strokeWidth={2} /> {streak}-week streak
          </p>
        )}
      </div>
    </div>
  );
}
