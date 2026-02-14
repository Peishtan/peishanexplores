import { useState } from "react";
import { useSkillMilestones, useSkillMilestoneProgress, type SkillMilestoneProgress } from "@/hooks/useSkillMilestones";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, CheckCircle2, Circle, Loader2, X, Compass, TrendingUp, Crown } from "lucide-react";
import { format } from "date-fns";

interface EvidenceLog {
  id: string;
  type: string;
  start_time: string;
  distance: number | null;
  elevation_gain: number | null;
  duration: number;
  route: string | null;
}

type Tier = "foundation" | "intermediate" | "advanced";

const TIER_CONFIG: Record<Tier, { label: string; icon: typeof Compass; badgeClass: string }> = {
  foundation: { label: "Foundation", icon: Compass, badgeClass: "bg-muted text-muted-foreground" },
  intermediate: { label: "Intermediate", icon: TrendingUp, badgeClass: "bg-accent/15 text-accent-foreground" },
  advanced: { label: "Advanced", icon: Crown, badgeClass: "bg-primary/15 text-primary" },
};

function getMilestoneTier(ms: { milestone_type: string; threshold_elevation_ft?: number | null; threshold_distance_mi?: number | null }): Tier {
  // Elevation milestones by threshold
  if (ms.milestone_type === "SINGLE_ACTIVITY_OVER_ELEVATION") {
    const ft = ms.threshold_elevation_ft ?? 0;
    if (ft >= 5000) return "advanced";
    if (ft >= 3000) return "intermediate";
    return "foundation";
  }
  // Distance milestones
  if (ms.milestone_type === "SINGLE_ACTIVITY_OVER_DISTANCE") {
    const mi = ms.threshold_distance_mi ?? 0;
    if (mi >= 20) return "advanced";
    if (mi >= 15) return "intermediate";
    return "foundation";
  }
  return "foundation";
}

export default function SkillMilestonesCard() {
  const { data: milestones, isLoading: loadingDefs } = useSkillMilestones();
  const { data: progress, isLoading: loadingProgress } = useSkillMilestoneProgress();
  const [selectedProgress, setSelectedProgress] = useState<SkillMilestoneProgress | null>(null);
  const [evidenceLogs, setEvidenceLogs] = useState<EvidenceLog[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const isLoading = loadingDefs || loadingProgress;

  const progressMap = new Map<string, SkillMilestoneProgress>();
  progress?.forEach((p) => progressMap.set(p.milestone_id, p));

  // Group milestones by tier
  const grouped = milestones?.reduce<Record<Tier, typeof milestones>>((acc, ms) => {
    const tier = getMilestoneTier(ms);
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(ms);
    return acc;
  }, { foundation: [], intermediate: [], advanced: [] });

  const handleViewEvidence = async (p: SkillMilestoneProgress) => {
    setSelectedProgress(p);
    if (p.evidence_log_ids && p.evidence_log_ids.length > 0) {
      setLoadingEvidence(true);
      const { data } = await supabase
        .from("activities")
        .select("id, type, start_time, distance, elevation_gain, duration, route")
        .in("id", p.evidence_log_ids);
      setEvidenceLogs((data as EvidenceLog[]) ?? []);
      setLoadingEvidence(false);
    } else {
      setEvidenceLogs([]);
    }
  };

  const tierOrder: Tier[] = ["foundation", "intermediate", "advanced"];

  return (
    <>
      <div className="rounded-2xl bg-card p-4 border border-border shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              Skill Milestones
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Automatically unlocked from your activity logs</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {tierOrder.map((tier) => {
              const items = grouped?.[tier];
              if (!items || items.length === 0) return null;
              const config = TIER_CONFIG[tier];
              const TierIcon = config.icon;

              return (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                      <TierIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="space-y-0 divide-y divide-border">
                    {items.map((ms) => {
                      const p = progressMap.get(ms.id);
                      const status = p?.status ?? "locked";
                      const current = p?.progress_current ?? 0;
                      const target = p?.progress_target ?? 1;
                      const pct = status === "achieved" ? 100 : Math.min((current / target) * 100, 100);

                      return (
                        <button
                          key={ms.id}
                          onClick={() => p && handleViewEvidence(p)}
                          className="flex items-center justify-between py-3 w-full text-left hover:bg-muted/50 transition-colors -mx-1 px-1 rounded"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {status === "achieved" ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <div className="relative shrink-0">
                                <Circle className="h-4 w-4 text-muted-foreground" />
                                {status === "in_progress" && pct > 0 && (
                                  <svg className="absolute inset-0 h-4 w-4 -rotate-90" viewBox="0 0 16 16">
                                    <circle cx="8" cy="8" r="6" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"
                                      strokeDasharray={`${(pct / 100) * 37.7} 37.7`} strokeLinecap="round" />
                                  </svg>
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground block truncate">
                                {ms.title}
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                {status === "achieved" && p?.achieved_at
                                  ? `Unlocked ${format(new Date(p.achieved_at), "MMM d")}`
                                  : status === "in_progress"
                                  ? `In progress`
                                  : "Not started"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {status === "achieved" ? (
                              <span className="text-xs font-semibold text-primary">✅ Unlocked</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                {current} / {target}
                                {(ms.milestone_type === "QUARTERLY_DISTANCE_TARGET") && " mi"}
                                {(ms.milestone_type === "QUARTERLY_ELEVATION_AVG_TARGET") && " ft"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {(!milestones || milestones.length === 0) && (
              <p className="text-xs text-muted-foreground py-3 text-center">No milestones configured.</p>
            )}
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {selectedProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedProgress(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-lg max-w-md w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {selectedProgress.skill_milestones?.title ?? "Milestone"}
              </h3>
              <button onClick={() => setSelectedProgress(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                selectedProgress.status === "achieved"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {selectedProgress.status === "achieved"
                  ? `✅ Unlocked${selectedProgress.achieved_at ? ` ${format(new Date(selectedProgress.achieved_at), "MMM d, yyyy")}` : ""}`
                  : `${selectedProgress.progress_current} / ${selectedProgress.progress_target}`}
              </span>
            </div>

            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Evidence Logs</h4>
            {loadingEvidence ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
            ) : evidenceLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No qualifying logs yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {evidenceLogs.map((log) => (
                  <div key={log.id} className="text-xs bg-muted/50 rounded-lg p-2.5 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground capitalize">{log.type.replace("_", " ")}</span>
                      <span className="text-muted-foreground">{format(new Date(log.start_time), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex gap-3 text-muted-foreground">
                      {log.distance != null && <span>{log.distance} mi</span>}
                      {log.elevation_gain != null && <span>{log.elevation_gain.toLocaleString()} ft</span>}
                      <span>{log.duration} min</span>
                      {log.route && <span>{log.route}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
