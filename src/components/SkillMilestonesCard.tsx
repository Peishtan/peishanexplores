import { useSkillMilestones, useSkillMilestoneProgress, useRecomputeMilestones, type SkillMilestoneProgress } from "@/hooks/useSkillMilestones";
import { CheckCircle2, Lock, Loader2, Compass } from "lucide-react";
import { format } from "date-fns";
import { format } from "date-fns";


type Tier = "foundation" | "intermediate" | "advanced";

const TIER_CONFIG: Record<Tier, { label: string; color: string }> = {
  foundation: { label: "Beginner", color: "text-fog" },
  intermediate: { label: "Intermediate", color: "text-fog" },
  advanced: { label: "Advanced", color: "text-fog" },
};

function getMilestoneTier(ms: { milestone_type: string; threshold_elevation_ft?: number | null; threshold_distance_mi?: number | null }): Tier {
  if (ms.milestone_type === "SINGLE_ACTIVITY_OVER_ELEVATION") {
    const ft = ms.threshold_elevation_ft ?? 0;
    if (ft >= 5000) return "advanced";
    if (ft >= 3000) return "intermediate";
    return "foundation";
  }
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
  const recompute = useRecomputeMilestones();

  const isLoading = loadingDefs || loadingProgress;

  const progressMap = new Map<string, SkillMilestoneProgress>();
  progress?.forEach((p) => progressMap.set(p.milestone_id, p));

  const grouped = milestones?.reduce<Record<Tier, typeof milestones>>((acc, ms) => {
    const tier = getMilestoneTier(ms);
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(ms);
    return acc;
  }, { foundation: [], intermediate: [], advanced: [] });

  const tierOrder: Tier[] = ["foundation", "intermediate", "advanced"];

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-fog" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0">
        {tierOrder.map((tier) => {
          const items = grouped?.[tier];
          if (!items || items.length === 0) return null;
          const config = TIER_CONFIG[tier];

          return (
            <div key={tier}>
              {/* Tier heading with line */}
              <div className={`font-mono-dm text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 py-2 mt-5 ${config.color}`}>
                <Compass className="h-3 w-3" strokeWidth={1.5} />
                {config.label}
                <div className="flex-1 h-px bg-current opacity-15" />
              </div>

              <div className="flex flex-col gap-1.5 mb-1">
                {items.map((ms) => {
                  const p = progressMap.get(ms.id);
                  const status = p?.status ?? "locked";
                  const current = p?.progress_current ?? 0;
                  const target = p?.progress_target ?? 1;
                  const unlocked = status === "achieved";

                  return (
                    <div
                      key={ms.id}
                      className={`relative group/tip flex items-center gap-3 p-3 rounded-xl bg-card border transition-colors text-left cursor-default ${
                        unlocked ? "border-[rgba(122,184,124,0.15)]" : "border-[rgba(255,255,255,0.05)] opacity-75"
                      }`}
                    >
                      {unlocked ? (
                        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] border-done"
                             style={{ background: 'rgba(106,191,122,0.15)' }}>
                          <CheckCircle2 className="h-[11px] w-[11px] text-done" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] border-[rgba(255,255,255,0.15)]">
                          <Lock className="h-[11px] w-[11px] text-fog" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-normal text-mist leading-snug">{ms.title}</p>
                        {unlocked && p?.achieved_at ? (
                          <p className="font-mono-dm text-[10px] text-done mt-0.5">
                            Unlocked {format(new Date(p.achieved_at), "MMM d")}
                          </p>
                        ) : status === "in_progress" ? (
                          <p className="font-mono-dm text-[10px] text-fog mt-0.5">
                            {current > 0 ? `Longest so far: ${current}${ms.milestone_type.includes("ELEVATION") ? " ft" : " mi"}` : "In progress"}
                          </p>
                        ) : null}
                      </div>
                      {!unlocked && (
                        <span className="font-mono-dm text-[10px] text-fog text-right flex-shrink-0 whitespace-nowrap">
                          {current} / {target}{ms.milestone_type.includes("ELEVATION") ? " ft" : " mi"}
                        </span>
                      )}
                      {/* Hover tooltip */}
                      {unlocked && p && (
                        <div className="hidden group-hover/tip:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                          bg-card border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 shadow-lg w-48">
                          <p className="font-mono-dm text-[10px] text-fog uppercase tracking-[0.1em] mb-1">Milestone</p>
                          <p className="text-[12px] text-mist leading-snug">{ms.title}</p>
                          {p.achieved_at && (
                            <p className="font-mono-dm text-[10px] text-done mt-0.5">
                              Unlocked {format(new Date(p.achieved_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {(!milestones || milestones.length === 0) && (
          <p className="text-xs text-fog py-4 text-center">No milestones configured.</p>
        )}
      </div>

      {/* Evidence Modal */}
      {selectedProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedProgress(null)}>
          <div className="bg-card rounded-2xl border border-[rgba(255,255,255,0.1)] max-w-md w-full mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold">
                {selectedProgress.skill_milestones?.title ?? "Milestone"}
              </h3>
              <button onClick={() => setSelectedProgress(null)} className="p-1 rounded hover:bg-secondary text-fog">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3">
              <span className={`font-mono-dm text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-full ${
                selectedProgress.status === "achieved"
                  ? "bg-[rgba(106,191,122,0.15)] text-done border border-[rgba(106,191,122,0.3)]"
                  : "bg-secondary text-fog"
              }`}>
                {selectedProgress.status === "achieved"
                  ? `Unlocked${selectedProgress.achieved_at ? ` ${format(new Date(selectedProgress.achieved_at), "MMM d, yyyy")}` : ""}`
                  : `${selectedProgress.progress_current} / ${selectedProgress.progress_target}`}
              </span>
            </div>

            <h4 className="font-mono-dm text-[9px] uppercase tracking-[0.15em] text-fog mb-2">Evidence Logs</h4>
            {loadingEvidence ? (
              <Loader2 className="h-4 w-4 animate-spin text-fog mx-auto" />
            ) : evidenceLogs.length === 0 ? (
              <p className="text-xs text-fog">No qualifying logs yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {evidenceLogs.map((log) => (
                  <div key={log.id} className="text-xs bg-secondary rounded-xl p-2.5 border border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">{log.type.replace("_", " ")}</span>
                      <span className="text-fog font-mono-dm text-[10px]">{format(new Date(log.start_time), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex gap-3 text-fog">
                      {log.distance != null && <span>{log.distance} mi</span>}
                      {log.elevation_gain != null && <span>{log.elevation_gain.toLocaleString()} ft</span>}
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
