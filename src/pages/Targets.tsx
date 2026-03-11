import { useState, useEffect, useMemo } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import SkillMilestonesCard from "@/components/SkillMilestonesCard";
import { Waves, Mountain, Footprints, Dumbbell, Check } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function getQuarterBounds(now: Date) {
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(y, q * 3, 1);
  const end = new Date(y, (q + 1) * 3, 0, 23, 59, 59, 999);
  return { start, end };
}

export default function Targets() {
  const { data: profile, isLoading } = useProfile();
  const { data: activities } = useActivities();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);

  const [kayakQ, setKayakQ] = useState("90");
  const [hikingQ, setHikingQ] = useState("60");
  const [elevAvg, setElevAvg] = useState("1200");
  const [kayakW, setKayakW] = useState("1");
  const [outdoorW, setOutdoorW] = useState("1");
  const [gymW, setGymW] = useState("3");

  useEffect(() => {
    if (profile) {
      setKayakQ(String(profile.goal_kayak_quarterly_miles ?? 90));
      setHikingQ(String(profile.goal_hiking_quarterly_miles ?? 60));
      setElevAvg(String(profile.goal_elevation_avg ?? 1200));
      setKayakW(String(profile.goal_kayak_per_week ?? 1));
      setOutdoorW(String(profile.goal_outdoor_per_week ?? 1));
      setGymW(String(profile.goal_exercises_per_week ?? 3));
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      {
        goal_kayak_quarterly_miles: parseInt(kayakQ) || 90,
        goal_hiking_quarterly_miles: parseInt(hikingQ) || 60,
        goal_elevation_avg: parseInt(elevAvg) || 1200,
        goal_kayak_per_week: parseInt(kayakW) || 1,
        goal_outdoor_per_week: parseInt(outdoorW) || 1,
        goal_exercises_per_week: parseInt(gymW) || 3,
      } as any,
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Targets saved");
        },
      }
    );
  };

  // Pacing model
  const pacing = useMemo(() => {
    const now = new Date();
    const { start, end } = getQuarterBounds(now);
    const totalWeeks = (end.getTime() - start.getTime()) / (7 * 86400000);
    const weeksElapsed = Math.max((now.getTime() - start.getTime()) / (7 * 86400000), 0.1);
    const weeksRemaining = Math.max(totalWeeks - weeksElapsed, 0.1);

    const qActivities = activities?.filter(a => {
      const d = new Date(a.start_time);
      return d >= start && d <= end;
    }) ?? [];

    const kayakMiles = qActivities.filter(a => a.type === "kayaking").reduce((s, a) => s + (a.distance ?? 0), 0);
    const hikingMiles = qActivities.filter(a => ["hiking", "xc_skiing"].includes(a.type)).reduce((s, a) => s + (a.distance ?? 0), 0);
    const elevations = qActivities.filter(a => (a.elevation_gain ?? 0) > 0);
    const avgElev = elevations.length > 0 ? elevations.reduce((s, a) => s + (a.elevation_gain ?? 0), 0) / elevations.length : 0;

    const kayakTarget = parseInt(kayakQ) || 90;
    const hikingTarget = parseInt(hikingQ) || 60;
    const elevTarget = parseInt(elevAvg) || 1200;

    const kayakRemaining = Math.max(kayakTarget - kayakMiles, 0);
    const hikingRemaining = Math.max(hikingTarget - hikingMiles, 0);

    return {
      kayak: { current: kayakMiles, target: kayakTarget, needed: kayakRemaining / weeksRemaining, avg: kayakMiles / weeksElapsed, done: kayakMiles >= kayakTarget },
      hiking: { current: hikingMiles, target: hikingTarget, needed: hikingRemaining / weeksRemaining, avg: hikingMiles / weeksElapsed, done: hikingMiles >= hikingTarget },
      elev: { current: Math.round(avgElev), target: elevTarget, done: avgElev >= elevTarget },
    };
  }, [activities, kayakQ, hikingQ, elevAvg]);

  const weeklyStatus = useMemo(() => {
    if (!activities) return { kayak: 0, outdoor: 0, gym: 0 };
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekActivities = activities.filter(a => new Date(a.start_time) >= monday);
    return {
      kayak: weekActivities.filter(a => a.type === "kayaking").length,
      outdoor: weekActivities.filter(a => ["hiking", "xc_skiing"].includes(a.type)).length,
      gym: weekActivities.filter(a => ["peloton", "orange_theory"].includes(a.type)).length,
    };
  }, [activities]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-moss-light" />
      </div>
    );
  }

  const qLabel = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner title="Targets" subtitle="Goals & milestones" compact />

      <div className="mx-auto max-w-[420px] md:max-w-[880px]">
        <div className="md:grid md:grid-cols-2 md:gap-x-6">
          {/* Left Column: Quarterly Targets */}
          <div>
            {/* Quarterly Targets header */}
            <div className="flex items-center justify-between px-6 mt-[28px] mb-[14px]">
              <span className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-fog">Quarterly Targets</span>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={`font-mono-dm text-[11px] tracking-[0.1em] px-3 py-1.5 rounded-full border transition-all ${
                  editing
                    ? "text-amber border-[rgba(224,149,72,0.35)] bg-[rgba(224,149,72,0.1)]"
                    : "text-fog bg-card border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                }`}
              >
                {editing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="px-4 space-y-2.5">
              {/* Kayak Target */}
              <TargetCard
                name="Kayak"
                current={pacing.kayak.current}
                target={pacing.kayak.target}
                unit="mi"
                done={pacing.kayak.done}
                avg={pacing.kayak.avg}
                needed={pacing.kayak.needed}
                editing={editing}
                editValue={kayakQ}
                onEditChange={setKayakQ}
                editLabel={`${qLabel} target (miles)`}
              />

              {/* Hiking Target */}
              <TargetCard
                name="Hiking / XC Ski"
                current={pacing.hiking.current}
                target={pacing.hiking.target}
                unit="mi"
                done={pacing.hiking.done}
                avg={pacing.hiking.avg}
                needed={pacing.hiking.needed}
                editing={editing}
                editValue={hikingQ}
                onEditChange={setHikingQ}
                editLabel={`${qLabel} target (miles)`}
              />

              {/* Elevation Target */}
              <div className={`bg-card border rounded-[14px] p-4 ${pacing.elev.done ? "border-[rgba(122,184,124,0.2)]" : "border-[rgba(255,255,255,0.06)]"}`}>
                <div className="flex justify-between items-start gap-3 mb-3.5">
                  <div className="flex-1">
                    <p className="font-display text-[17px] font-bold mb-1">Elevation avg</p>
                    <p className="text-xs text-fog font-light">
                      Avg <span className="text-moss-light font-medium">{pacing.elev.current.toLocaleString()} ft</span> · target {pacing.elev.target.toLocaleString()} ft
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <p className="font-display text-[28px] font-black leading-none tracking-tight">
                      {pacing.elev.current.toLocaleString()}<span className="font-mono-dm text-xs font-normal text-fog ml-1">ft</span>
                    </p>
                    <span className="font-mono-dm text-[10px] text-fog">avg</span>
                    {pacing.elev.done && (
                      <span className="font-mono-dm text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full bg-[rgba(122,184,124,0.15)] text-moss-light border border-[rgba(122,184,124,0.25)] mt-0.5">
                        Above target
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-[5px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min((pacing.elev.current / pacing.elev.target) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, hsl(var(--moss)) 0%, hsl(var(--moss-light)) 100%)'
                  }} />
                </div>
                {editing && (
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgba(255,255,255,0.06)] animate-fade-slide-up">
                    <label className="font-mono-dm text-[11px] text-fog tracking-[0.08em]">Target avg elevation (ft)</label>
                    <input type="number" value={elevAvg} onChange={(e) => setElevAvg(e.target.value)}
                      className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-lg text-foreground font-mono-dm text-sm px-2.5 py-1.5 w-20 text-right outline-none focus:border-moss-light" />
                  </div>
                )}
              </div>
            </div>

            {/* Save button in edit mode */}
            {editing && (
              <div className="px-4 pt-4">
                <button onClick={handleSave} className="w-full font-mono-dm text-xs tracking-[0.12em] uppercase bg-moss text-paper py-3.5 rounded-xl hover:bg-moss-light hover:text-ink transition-colors">
                  Save changes
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Weekly Rhythm + Milestones */}
          <div>
            {/* Weekly Rhythm */}
            <div className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-fog px-6 mt-[32px] md:mt-[28px] mb-[14px]">
              Weekly Rhythm
            </div>
            <div className="px-4 space-y-2">
              <RhythmCard
                icon={<Waves className="h-5 w-5 text-fog" strokeWidth={1.5} />}
                name="Paddle"
                rule={`${kayakW} session / week`}
                current={weeklyStatus.kayak}
                goal={parseInt(kayakW) || 1}
                editing={editing}
                editValue={kayakW}
                onEditChange={setKayakW}
              />
              <RhythmCard
                icon={<Footprints className="h-5 w-5 text-fog" strokeWidth={1.5} />}
                name="Hike or Ski"
                rule={`${outdoorW} session / week`}
                current={weeklyStatus.outdoor}
                goal={parseInt(outdoorW) || 1}
                editing={editing}
                editValue={outdoorW}
                onEditChange={setOutdoorW}
              />
              <RhythmCard
                icon={<Dumbbell className="h-5 w-5 text-fog" strokeWidth={1.5} />}
                name="Gym classes"
                rule={`${gymW} sessions / week`}
                current={weeklyStatus.gym}
                goal={parseInt(gymW) || 3}
                editing={editing}
                editValue={gymW}
                onEditChange={setGymW}
              />
            </div>

            {/* Skill Milestones */}
            <div className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-fog px-6 mt-[32px] mb-[14px]">
              Skill Milestones
            </div>
            <div className="px-4">
              <SkillMilestonesCard />
            </div>

            <div className="h-24" />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

/* ── Target Card ── */
function TargetCard({ name, current, target, unit, done, avg, needed, editing, editValue, onEditChange, editLabel }: {
  name: string; current: number; target: number; unit: string; done: boolean;
  avg: number; needed: number; editing: boolean; editValue: string; onEditChange: (v: string) => void; editLabel: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const expectedPct = (() => {
    const now = new Date();
    const { start, end } = getQuarterBounds(now);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return (elapsed / total) * 100;
  })();

  return (
    <div className={`bg-card border rounded-[14px] p-4 ${done ? "border-[rgba(122,184,124,0.2)]" : "border-[rgba(255,255,255,0.06)]"}`}>
      <div className="flex justify-between items-start gap-3 mb-3.5">
        <div className="flex-1">
          <p className="font-display text-[17px] font-bold mb-1">{name}</p>
          <p className="text-xs text-fog font-light">
            {done ? (
              <>Goal smashed · averaging <span className="text-done font-medium">{avg.toFixed(1)} {unit}/wk</span></>
            ) : (
              <>Need <strong>{needed.toFixed(1)} {unit}/wk</strong> to finish · averaging <span className="text-moss-light font-medium">{avg.toFixed(1)} {unit}/wk</span></>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <p className="font-display text-[28px] font-black leading-none tracking-tight">
            {current.toFixed(0)}<span className="font-mono-dm text-xs font-normal text-fog ml-1">{unit}</span>
          </p>
          <span className="font-mono-dm text-[10px] text-fog">of {target}</span>
          {done ? (
            <span className="font-mono-dm text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 bg-[rgba(106,191,122,0.15)] text-done border border-[rgba(106,191,122,0.3)] mt-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8m-4-4v4M6 3H4a2 2 0 000 4c0 2 1.5 3.5 3 4m9-8h2a2 2 0 010 4c0 2-1.5 3.5-3 4M6 3h12v5a6 6 0 01-12 0V3z"/></svg>
              Achieved
            </span>
          ) : (
            <span className={`font-mono-dm text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full mt-0.5 ${
              avg >= needed
                ? "bg-[rgba(122,184,124,0.15)] text-moss-light border border-[rgba(122,184,124,0.25)]"
                : "bg-[rgba(224,149,72,0.15)] text-amber border border-[rgba(224,149,72,0.3)]"
            }`}>
              {avg >= needed ? "On track" : "At risk"}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-[5px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-visible">
        <div className={`h-full rounded-full`} style={{
          width: `${pct}%`,
          background: done
            ? 'linear-gradient(90deg, hsl(var(--moss)) 0%, hsl(var(--done)) 100%)'
            : 'linear-gradient(90deg, hsl(var(--moss)) 0%, hsl(var(--moss-light)) 100%)'
        }} />
        {!done && (
          <div className="absolute -top-[3px] w-0.5 h-[11px] bg-amber rounded-[1px]"
               style={{ left: `${expectedPct}%`, transform: 'translateX(-50%)' }}
               title="Pace marker" />
        )}
      </div>
      {!done && (
        <div className="flex justify-between items-center mt-1.5 font-mono-dm text-[9px] text-[rgba(255,255,255,0.2)]">
          <span>0</span>
          <span className="text-fog text-[9px]">▲ pace</span>
          <span>{target} {unit}</span>
        </div>
      )}
      {editing && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgba(255,255,255,0.06)] animate-fade-slide-up">
          <label className="font-mono-dm text-[11px] text-fog tracking-[0.08em]">{editLabel}</label>
          <input type="number" value={editValue} onChange={(e) => onEditChange(e.target.value)}
            className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-lg text-foreground font-mono-dm text-sm px-2.5 py-1.5 w-20 text-right outline-none focus:border-moss-light" />
        </div>
      )}
    </div>
  );
}

/* ── Rhythm Card ── */
function RhythmCard({ icon, name, rule, current, goal, editing, editValue, onEditChange }: {
  icon: React.ReactNode; name: string; rule: string; current: number; goal: number;
  editing: boolean; editValue: string; onEditChange: (v: string) => void;
}) {
  const done = current >= goal;
  return (
    <div className="bg-card border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3.5 flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-2.5 flex-1">
        {icon}
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="font-mono-dm text-[10px] text-fog mt-0.5">{rule}</p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center gap-1 font-mono-dm text-[11px] px-2.5 py-1 rounded-full tracking-[0.08em] ${
          done
            ? "bg-[rgba(122,184,124,0.15)] text-moss-light border border-[rgba(122,184,124,0.25)]"
            : "bg-[rgba(224,149,72,0.12)] text-amber border border-[rgba(224,149,72,0.25)]"
        }`}>
          {done ? (
            <>
              <Check className="h-3 w-3" strokeWidth={2.5} /> Done
            </>
          ) : (
            `${current} / ${goal}`
          )}
        </span>
      </div>
      {editing && (
        <div className="w-full flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.06)] animate-fade-slide-up">
          <label className="font-mono-dm text-[11px] text-fog tracking-[0.08em]">Sessions per week</label>
          <input type="number" value={editValue} onChange={(e) => onEditChange(e.target.value)} min="1" max="7"
            className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-lg text-foreground font-mono-dm text-sm px-2.5 py-1.5 w-[60px] text-right outline-none focus:border-moss-light" />
        </div>
      )}
    </div>
  );
}
