import { useMemo, useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { useProfile } from "@/hooks/useProfile";
import { useSkillMilestoneProgress, useSkillMilestones } from "@/hooks/useSkillMilestones";
import { getAvailableQuarters, computeScorecard, type QuarterInfo, type ScorecardData } from "@/hooks/useScorecardData";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, TrendingUp, Sparkles, AlertTriangle, Trophy, Loader2, Medal, Footprints, Waves, Mountain, Ruler } from "lucide-react";

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

            {/* ── Targets Hit / Missed ── */}
            <ScorecardSection title="Targets" icon={<Trophy className="h-4 w-4 text-muted-foreground" />}>
              <div className="space-y-3">
                {scorecard.targets.map((t) => (
                  <TargetRow key={t.label} {...t} />
                ))}
              </div>
            </ScorecardSection>

            {/* ── Consistency ── */}
            <ScorecardSection title="Consistency" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}>
              <div className="space-y-3">
                {scorecard.consistency.map((c) => (
                  <ConsistencyRow key={c.label} {...c} />
                ))}
              </div>
            </ScorecardSection>

            {/* ── Highlights Reel ── */}
            {scorecard.highlights.length > 0 && (
              <ScorecardSection title="Highlights" icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}>
                <div className="grid grid-cols-2 gap-3">
                  {scorecard.highlights.map((h) => (
                    <HighlightCard key={h.label} {...h} />
                  ))}
                </div>
              </ScorecardSection>
            )}

            {/* ── Strengths & Gaps ── */}
            {scorecard.insights.length > 0 && (
              <ScorecardSection title="Review" icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}>
                <div className="space-y-2">
                  {scorecard.insights.map((ins, i) => (
                    <InsightRow key={i} {...ins} />
                  ))}
                </div>
              </ScorecardSection>
            )}

            {/* ── Summary Stats ── */}
            <div className="rounded-xl bg-secondary/50 border border-border p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{scorecard.totalActivities}</p>
                  <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">Activities</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{scorecard.totalMiles}</p>
                  <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">Miles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{scorecard.totalElevation.toLocaleString()}</p>
                  <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">ft Elevation</p>
                </div>
              </div>
            </div>
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
  const cons = scorecard.overallConsistency;

  // Compute a letter grade
  const score = (targetsHit / Math.max(totalTargets, 1)) * 50 + (cons / 100) * 50;
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  const gradeColor = score >= 75 ? "text-done" : score >= 50 ? "text-amber" : "text-destructive";
  const label = score >= 90 ? "Outstanding" : score >= 75 ? "Strong" : score >= 60 ? "Solid" : score >= 40 ? "Building" : "Getting Started";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        {scorecard.quarter.isCurrent ? "Current Quarter" : "Final Grade"}
      </p>
      <p className={`font-display text-[72px] font-black leading-none ${gradeColor}`}>{grade}</p>
      <p className="font-mono-dm text-sm text-muted-foreground mt-1">{label}</p>
      <div className="flex justify-center gap-6 mt-4">
        <div>
          <p className="text-lg font-bold text-foreground">{targetsHit}/{totalTargets}</p>
          <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">Targets</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-lg font-bold text-foreground">{cons}%</p>
          <p className="text-[10px] font-mono-dm uppercase tracking-wider text-muted-foreground">Consistency</p>
        </div>
      </div>
    </div>
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
  ruler: <Ruler className="h-5 w-5 text-muted-foreground" />,
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
