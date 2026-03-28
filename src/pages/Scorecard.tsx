import { useMemo, useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { useProfile } from "@/hooks/useProfile";
import { useSkillMilestoneProgress, useSkillMilestones } from "@/hooks/useSkillMilestones";
import { getAvailableQuarters, computeScorecard, type QuarterInfo, type ScorecardData, type SportBreakdown } from "@/hooks/useScorecardData";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, TrendingUp, Sparkles, AlertTriangle, Trophy, Loader2, Medal, Footprints, Waves, Mountain, Snowflake, Activity, MapPin, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Scorecard() {
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: milestoneProgress, isLoading: milestonesLoading } = useSkillMilestoneProgress();
  const { data: allMilestones } = useSkillMilestones();

  const quarters = useMemo(() => {
    if (!activities) return [];
    return getAvailableQuarters(activities);
  }, [activities]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedQuarter = quarters[selectedIdx] ?? null;

  const scorecard = useMemo(() => {
    if (!activities || !profile || !milestoneProgress || !selectedQuarter) return null;
    return computeScorecard(selectedQuarter, activities, profile, milestoneProgress, allMilestones?.length ?? 9);
  }, [activities, profile, milestoneProgress, selectedQuarter, allMilestones]);

  const isLoading = activitiesLoading || profileLoading || milestonesLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner title="Scorecard" subtitle="Season Review" compact />

      <div className="mx-auto max-w-[420px] px-5 pt-6 space-y-6">
        {/* Quarter Selector */}
        {quarters.length > 0 && (
          <Select value={selectedIdx.toString()} onValueChange={(v) => setSelectedIdx(parseInt(v))}>
            <SelectTrigger className="w-full bg-secondary border-border font-mono-dm text-sm tracking-wide">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((q, i) => (
                <SelectItem key={q.label} value={i.toString()}>
                  {q.label} {q.isCurrent ? "(Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {scorecard && !isLoading && (
          <div className="space-y-6 animate-fade-slide-up">
            {/* ── Overall Grade ── */}
            <OverallGrade scorecard={scorecard} />

            {/* ── Strengths & Gaps ── */}
            {scorecard.insights.length > 0 && (
              <ScorecardSection title="Review" icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}>
                <div className="space-y-3">
                  <ReviewTopline scorecard={scorecard} />
                  <div className="border-t border-border pt-3 space-y-2">
                    {scorecard.insights.map((ins, i) => (
                      <InsightRow key={i} {...ins} />
                    ))}
                  </div>
                </div>
              </ScorecardSection>
            )}

            {/* ── Highlights ── */}
            <ScorecardSection title="Highlights" icon={<Trophy className="h-4 w-4 text-muted-foreground" />}>
              <div className="flex gap-4 mb-3">
                {/* Sport Mix Donut */}
                {scorecard.sportBreakdown.length > 0 && (
                  <SportDonut breakdown={scorecard.sportBreakdown} total={scorecard.totalActivities} />
                )}
                <div className="grid grid-cols-1 gap-2 flex-1">
                  <MiniStat label="Activities" value={scorecard.totalActivities.toString()} />
                  <MiniStat label="Miles" value={scorecard.totalMiles.toString()} />
                  <MiniStat label="Elevation" value={`${scorecard.totalElevation.toLocaleString()} ft`} />
                </div>
              </div>
              {scorecard.highlights.length > 0 && (
                <div className={`grid gap-3 ${scorecard.highlights.length % 2 === 1 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {scorecard.highlights.map((h, i) => (
                    <HighlightCard key={i} {...h} />
                  ))}
                </div>
              )}
            </ScorecardSection>

            {/* ── Targets ── */}
            <ScorecardSection title="Targets" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}>
              <div className="space-y-4">
                {scorecard.targets.map((t, i) => (
                  <TargetRow key={i} {...t} />
                ))}
                <Link to="/targets" className="flex items-center justify-center gap-1.5 pt-2 font-mono-dm text-[11px] tracking-[0.1em] text-moss-light hover:text-moss transition-colors">
                  Adjust targets <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </ScorecardSection>

            {/* ── Consistency ── */}
            <ScorecardSection title="Consistency" icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}>
              <div className="space-y-4">
                {scorecard.consistency.map((c, i) => (
                  <ConsistencyRow key={i} {...c} />
                ))}
              </div>
            </ScorecardSection>

            {/* ── Score Formula ── */}
            <ScoreFormula scorecard={scorecard} />
          </div>
        )}

        {!isLoading && !scorecard && quarters.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">No activity data yet. Start logging to see your scorecard!</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

/* ── Sub-components ── */

function OverallGrade({ scorecard }: { scorecard: ScorecardData }) {
  const targetsHit = scorecard.targets.filter((t) => t.hit).length;
  const totalTargets = scorecard.targets.length;

  // ── Weighted grading model ──
  const targetScore = (targetsHit / Math.max(totalTargets, 1)) * 100;

  const gymCons = scorecard.consistency.find((c) => c.label === "Gym Sessions");
  const independentScore = gymCons?.pct ?? 0;

  const outdoorCons = scorecard.consistency.find((c) => c.label === "Outdoor Sessions");
  const kayakCons = scorecard.consistency.find((c) => c.label === "Paddle Sessions");
  const hikingTargetHit = scorecard.targets.find((t) => t.label.includes("Hiking"))?.hit ?? false;
  const kayakTargetHit = scorecard.targets.find((t) => t.label.includes("Paddle"))?.hit ?? false;
  const outdoorPct = hikingTargetHit ? Math.max(outdoorCons?.pct ?? 0, 75) : (outdoorCons?.pct ?? 0);
  const kayakPct = kayakTargetHit ? Math.max(kayakCons?.pct ?? 0, 75) : (kayakCons?.pct ?? 0);
  const dependentScore = (outdoorPct + kayakPct) / 2;

  const milestoneScore = scorecard.totalMilestones > 0
    ? Math.min((scorecard.milestonesAchievedTotal / scorecard.totalMilestones) * 100, 100)
    : 100;

  const score = targetScore * 0.45 + independentScore * 0.25 + dependentScore * 0.20 + milestoneScore * 0.10;

  const scoreColor = score >= 80 ? "text-done" : "text-amber";
  const label = score >= 93 ? "Outstanding" : score >= 87 ? "Excellent" : score >= 80 ? "Strong"
    : score >= 73 ? "Solid" : score >= 60 ? "Building" : "Getting Started";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        {scorecard.quarter.isCurrent ? "Current Quarter" : "Final Score"}
      </p>
      <p className={`font-display text-[72px] font-black leading-none ${scoreColor}`}>{Math.round(score)}%</p>
      <p className="font-mono-dm text-sm text-muted-foreground mt-1">{label}</p>
      <div className="flex justify-center gap-6 mt-4">
        <div>
          <p className="text-lg font-bold text-foreground">{targetsHit}/{totalTargets}</p>
          <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">Targets</p>
        </div>
      </div>
    </div>
  );
}

function ReviewTopline({ scorecard }: { scorecard: ScorecardData }) {
  const gymCons = scorecard.consistency.find((c) => c.label === "Gym Sessions");
  const outdoorCons = scorecard.consistency.find((c) => c.label === "Outdoor Sessions");
  const kayakCons = scorecard.consistency.find((c) => c.label === "Paddle Sessions");

  // Find weakest area by weighted impact
  const areas: { label: string; pct: number; weight: number; tip: string }[] = [
    { label: "gym consistency", pct: gymCons?.pct ?? 0, weight: 0.25, tip: "hitting your weekly gym sessions" },
    { label: "outdoor rhythm", pct: outdoorCons?.pct ?? 0, weight: 0.10, tip: "getting outside more regularly each week" },
    { label: "paddle rhythm", pct: kayakCons?.pct ?? 0, weight: 0.10, tip: "paddling more consistently each week" },
  ];

  const targetsHit = scorecard.targets.filter((t) => t.hit).length;
  if (targetsHit < scorecard.targets.length) {
    const missed = scorecard.targets.filter((t) => !t.hit);
    areas.push({ label: "distance targets", pct: (targetsHit / Math.max(scorecard.targets.length, 1)) * 100, weight: 0.45, tip: `logging more ${missed.map((m) => m.label.toLowerCase()).join(" and ")} miles` });
  }

  // Sort by potential impact (gap * weight)
  areas.sort((a, b) => (100 - a.pct) * a.weight - (100 - b.pct) * b.weight).reverse();

  const top = areas.find((a) => a.pct < 80);

  if (!top) {
    return (
      <p className="text-sm text-foreground/70 leading-relaxed">
        🔥 Exceptional quarter — all areas are firing. Keep this momentum going!
      </p>
    );
  }

  return (
    <p className="text-sm text-foreground/70 leading-relaxed">
      💡 <span className="font-medium text-foreground">Biggest lever to raise your score:</span> Focus on {top.tip}. Your {top.label} is at {top.pct}% — improving this could add the most points.
    </p>
  );
}

function ScorecardSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-mono-dm text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{title}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        {children}
      </div>
    </div>
  );
}

function TargetRow({ label, current, target, unit, hit }: { label: string; current: number; target: number; unit: string; hit: boolean }) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hit ? (
            <CheckCircle2 className="h-4 w-4 text-done" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="font-mono-dm text-xs text-muted-foreground">
          {current} / {target} {unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${hit ? "bg-done" : "bg-destructive"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ConsistencyRow({ label, weeksHit, totalWeeks, pct }: { label: string; weeksHit: number; totalWeeks: number; pct: number }) {
  const color = pct >= 80 ? "text-done" : pct >= 50 ? "text-amber" : "text-destructive";
  const barColor = pct >= 80 ? "bg-done" : pct >= 50 ? "bg-amber" : "bg-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <span className={`font-mono-dm text-xs font-bold ${color}`}>
          {weeksHit}/{totalWeeks} wks · {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const highlightIcons: Record<string, React.ReactNode> = {
  medal: <Medal className="h-5 w-5 text-muted-foreground" />,
  footprints: <Footprints className="h-5 w-5 text-muted-foreground" />,
  waves: <Waves className="h-5 w-5 text-muted-foreground" />,
  mountain: <Mountain className="h-5 w-5 text-muted-foreground" />,
  snowflake: <Snowflake className="h-5 w-5 text-muted-foreground" />,
  activity: <Activity className="h-5 w-5 text-muted-foreground" />,
  miles: <Footprints className="h-5 w-5 text-muted-foreground" />,
  elevation: <MapPin className="h-5 w-5 text-muted-foreground" />,
};

function HighlightCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border p-3 text-center">
      <div className="flex justify-center">{highlightIcons[icon] ?? null}</div>
      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
      <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function InsightRow({ type, text }: { type: "strength" | "gap"; text: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      {type === "strength" ? (
        <CheckCircle2 className="h-4 w-4 text-done mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber mt-0.5 shrink-0" />
      )}
      <p className="text-sm text-foreground/80 leading-snug">{text}</p>
    </div>
  );
}

function ScoreFormula({ scorecard }: { scorecard: ScorecardData }) {
  const [open, setOpen] = useState(false);

  const targetsHit = scorecard.targets.filter((t) => t.hit).length;
  const totalTargets = scorecard.targets.length;
  const targetScore = (targetsHit / Math.max(totalTargets, 1)) * 100;

  const gymCons = scorecard.consistency.find((c) => c.label === "Gym Sessions");
  const independentScore = gymCons?.pct ?? 0;

  const outdoorCons = scorecard.consistency.find((c) => c.label === "Outdoor Sessions");
  const kayakCons = scorecard.consistency.find((c) => c.label === "Paddle Sessions");
  const hikingTargetHit = scorecard.targets.find((t) => t.label.includes("Hiking"))?.hit ?? false;
  const kayakTargetHit = scorecard.targets.find((t) => t.label.includes("Paddle"))?.hit ?? false;
  const outdoorPct = hikingTargetHit ? Math.max(outdoorCons?.pct ?? 0, 75) : (outdoorCons?.pct ?? 0);
  const kayakPct = kayakTargetHit ? Math.max(kayakCons?.pct ?? 0, 75) : (kayakCons?.pct ?? 0);
  const dependentScore = (outdoorPct + kayakPct) / 2;

  const milestoneScore = scorecard.totalMilestones > 0
    ? Math.min((scorecard.milestonesAchievedTotal / scorecard.totalMilestones) * 100, 100)
    : 100;

  const rows = [
    { label: "Distance Targets", weight: 45, value: Math.round(targetScore), contribution: targetScore * 0.45 },
    { label: "Gym Consistency", weight: 25, value: Math.round(independentScore), contribution: independentScore * 0.25 },
    { label: "Outdoor / Paddle Rhythm", weight: 20, value: Math.round(dependentScore), contribution: dependentScore * 0.20 },
    { label: "Milestones", weight: 10, value: Math.round(milestoneScore), contribution: milestoneScore * 0.10 },
  ];

  const total = Math.round(rows.reduce((s, r) => s + r.contribution, 0));

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full"
      >
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono-dm text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          How the score works
        </span>
      </button>
      {open && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-fade-slide-up">
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-foreground/80">{r.label}</span>
                <span className="font-mono-dm text-xs text-muted-foreground">
                  {r.value}% × {r.weight}% = <span className="text-foreground font-bold">{Math.round(r.contribution)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="font-mono-dm text-sm font-bold text-foreground">{total}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Outdoor & kayak rhythm scores get a 75% floor when the corresponding distance target is met.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Sport Donut ── */
function SportDonut({ breakdown, total }: { breakdown: SportBreakdown[]; total: number }) {
  const size = 90;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = breakdown.map((s) => {
    const pct = s.count / total;
    const offset = accumulated;
    accumulated += pct;
    return { ...s, pct, offset };
  });

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.pct * circumference} ${circumference}`}
            strokeDashoffset={-seg.offset * circumference}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2 justify-center">
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="font-mono-dm text-[8px] text-fog tracking-[0.05em]">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Mini Stat ── */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 border border-border px-3 py-2">
      <p className="text-base font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[9px] font-mono-dm uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
