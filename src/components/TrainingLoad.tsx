import { Activity, Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, ShieldAlert } from "lucide-react";

interface TrainingLoadProps {
  last7: number;
  last30: number;
  trend: "increasing" | "decreasing" | "stable";
  risk: "low" | "moderate" | "high";
}

export default function TrainingLoad({ last7, last30, trend, risk }: TrainingLoadProps) {
  const trendIcon = trend === "increasing" ? <TrendingUp className="h-4 w-4" /> : trend === "decreasing" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />;
  const trendColor = trend === "increasing" ? "text-primary" : trend === "decreasing" ? "text-destructive" : "text-muted-foreground";
  const riskColor = risk === "high" ? "text-destructive" : risk === "moderate" ? "text-accent" : "text-primary";
  const riskIcon = risk === "high" ? <ShieldAlert className="h-4 w-4" /> : risk === "moderate" ? <AlertTriangle className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  const riskLabel = risk === "high" ? "High — Consider rest" : risk === "moderate" ? "Moderate" : "Low — Good to go";

  return (
    <div className="rounded-2xl bg-card p-6 border border-border shadow-elevated">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-calm text-primary-foreground">
          <Brain className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Recovery & Load</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Last 7 Days</p>
          <p className="text-2xl font-bold text-foreground mt-1">{last7.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">mi</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Last 30 Days</p>
          <p className="text-2xl font-bold text-foreground mt-1">{last30.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">mi</span></p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={trendColor}>{trendIcon}</span>
          <span className="text-sm text-foreground font-medium capitalize">{trend}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={riskColor}>{riskIcon}</span>
          <span className={`text-sm font-medium ${riskColor}`}>{riskLabel}</span>
        </div>
      </div>
    </div>
  );
}
