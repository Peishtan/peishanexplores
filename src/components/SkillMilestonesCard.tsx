import { useState } from "react";
import { useSkillMilestones, useSkillMilestoneProgress, type SkillMilestoneProgress } from "@/hooks/useSkillMilestones";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, CheckCircle2, Circle, Loader2, X } from "lucide-react";
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

export default function SkillMilestonesCard() {
  const { data: milestones, isLoading: loadingDefs } = useSkillMilestones();
  const { data: progress, isLoading: loadingProgress } = useSkillMilestoneProgress();
  const [selectedProgress, setSelectedProgress] = useState<SkillMilestoneProgress | null>(null);
  const [evidenceLogs, setEvidenceLogs] = useState<EvidenceLog[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const isLoading = loadingDefs || loadingProgress;

  // Build a map of milestone_id -> progress
  const progressMap = new Map<string, SkillMilestoneProgress>();
  progress?.forEach((p) => progressMap.set(p.milestone_id, p));

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
          <div className="space-y-0 divide-y divide-border">
            {milestones?.map((ms) => {
              const p = progressMap.get(ms.id);
              const status = p?.status ?? "locked";
              const current = p?.progress_current ?? 0;
              const target = p?.progress_target ?? 1;

              return (
                <button
                  key={ms.id}
                  onClick={() => p && handleViewEvidence(p)}
                  className="flex items-center justify-between py-3 w-full text-left hover:bg-muted/50 transition-colors -mx-1 px-1 rounded"
                >
                  <div className="flex items-center gap-2.5">
                    {status === "achieved" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <span className={`text-sm font-medium ${status === "achieved" ? "text-foreground" : "text-foreground"}`}>
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
