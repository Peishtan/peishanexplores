import { useMemo, useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { useProfile } from "@/hooks/useProfile";
import { useSkillMilestoneProgress, useSkillMilestones } from "@/hooks/useSkillMilestones";
import { getAvailableQuarters, computeScorecard, type QuarterInfo, type ScorecardData } from "@/hooks/useScorecardData";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, TrendingUp, Sparkles, AlertTriangle, Trophy, Loader2, Medal, Footprints, Waves, Mountain, Snowflake, Activity, MapPin, Info } from "lucide-react";

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
              <div className="grid grid-cols-3 gap-3 mb-3">
                <HighlightCard icon="activity" label="Activities" value={scorecard.totalActivities.toString()} />
                <HighlightCard icon="miles" label="Miles" value={scorecard.totalMiles.toString()} />
                <HighlightCard icon="elevation" label="ft Elevation" value={scorecard.totalElevation.toLocaleString()} />
              </div>
              {scorecard.highlights.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
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
  const kayakCons = scorecard.consistency.find((c) => c.label === "Kayak Sessions");
  const hikingTargetHit = scorecard.targets.find((t) => t.label.includes("Hiking"))?.hit ?? false;
  const kayakTargetHit = scorecard.targets.find((t) => t.label.includes("Kayak"))?.hit ?? false;
  const outdoorPct = hikingTargetHit ? Math.max(outdoorCons?.pct ?? 0, 75) : (outdoorCons?.pct ?? 0);
  const kayakPct = kayakTargetHit ? Math.max(kayakCons?.pct ?? 0, 75) : (kayakCons?.pct ?? 0);
  const dependentScore = (outdoorPct + kayakPct) / 2;

  const milestoneScore = scorecard.totalMilestones > 0
    ? Math.min((scorecard.milestonesAchievedTotal / scorecard.totalMilestones) * 100, 100)
    : 100;

  const score = targetScore * 0.45 + independentScore * 0.25 + dependentScore * 0.20 + milestoneScore * 0.10;

  const scoreColor = score >= 87 ? "text-done" : score >= 73 ? "text-amber" : "text-destructive";
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
  const kayakCons = scorecard.consistency.find((c) => c.label === "Kayak Sessions");

  // Find weakest area by weighted impact
  const areas: { label: string; pct: number; weight: number; tip: string }[] = [
    { label: "gym consistency", pct: gymCons?.pct ?? 0, weight: 0.25, tip: "hitting your weekly gym sessions" },
    { label: "outdoor rhythm", pct: outdoorCons?.pct ?? 0, weight: 0.10, tip: "getting outside more regularly each week" },
    { label: "kayak rhythm", pct: kayakCons?.pct ?? 0, weight: 0.10, tip: "paddling more consistently each week" },
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
