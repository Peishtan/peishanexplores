interface GoalCircleProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

export default function GoalCircle({ label, current, target, color }: GoalCircleProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const circumference = 251.2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48" cy="48" r="40"
            strokeWidth="8" fill="transparent"
            className="stroke-muted"
          />
          <circle
            cx="48" cy="48" r="40"
            strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * percentage) / 100}
            strokeLinecap="round"
            stroke={color}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{current}</span>
          <span className="text-[10px] text-muted-foreground">of {target}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
