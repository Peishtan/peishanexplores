import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  progress?: number; // 0-100
  gradient?: "primary" | "energy" | "calm";
}

export default function StatCard({ icon, label, value, unit, progress, gradient }: StatCardProps) {
  const gradientClass = gradient === "energy" ? "gradient-energy" : gradient === "calm" ? "gradient-calm" : "gradient-primary";

  return (
    <div className="rounded-xl bg-card p-4 shadow-card border border-border">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradientClass} text-primary-foreground`}>
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${gradientClass} transition-all duration-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
