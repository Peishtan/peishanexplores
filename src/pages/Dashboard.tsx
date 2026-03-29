import { useProfile, type Profile } from "@/hooks/useProfile";
import { format, startOfWeek } from "date-fns";
import { useActivities, type Activity } from "@/hooks/useActivities";
import { useDashboardInsights, type SparkPoint, type QuarterChallenge, type MomentumData, type ElevSparkPoint, type WeekResult, type WeekActivitySummary } from "@/hooks/useDashboardInsights";
import { useAchievedMilestones } from "@/hooks/useSkillMilestones";
import { useMilestoneEvidence } from "@/hooks/useMilestoneEvidence";
import BottomNav from "@/components/BottomNav";
import HeroBanner from "@/components/HeroBanner";
import { Trophy, Flame, TrendingUp, TrendingDown, Minus, CheckCircle2, Target, Waves, Mountain, Dumbbell, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useEffect, useRef, useState } from "react";


/* ── Count-up hook ── */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(target * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: activities } = useActivities();

  const exerciseGoal = profile?.goal_exercises_per_week ?? 3;
  const outdoorGoal = profile?.goal_outdoor_per_week ?? 1;
  const kayakGoal = profile?.goal_kayak_per_week ?? 1;
  const hikingTarget = profile?.goal_hiking_quarterly_miles ?? 60;
  const kayakTarget = profile?.goal_kayak_quarterly_miles ?? 90;

  const insights = useDashboardInsights(activities, {
    exercises: exerciseGoal,
    outdoor: outdoorGoal,
    kayak: kayakGoal,
    hikingTarget,
    kayakTarget,
  });

  const qLabel = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;
  const qMonths = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"][Math.floor(new Date().getMonth() / 3)];

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner title="Dashboard" subtitle={`${qLabel} ${qMonths}`} compact />

      <div className="mx-auto max-w-[420px] md:max-w-[880px]">
        <div className="md:grid md:grid-cols-2 md:gap-x-6">
          {/* ── Left Column: Challenges + Weekly Goals ── */}
          <div>
            {/* Achievement Banner (if hiking done) */}
            {insights?.hikingChallenge && insights.hikingChallenge.pct >= 100 && (
              <div className="pt-[40px]">
                <AchievementBanner
                  title="Hiking & XC Ski Challenge"
                  label={`${qLabel} Target Achieved`}
                  current={insights.hikingChallenge.current}
                  target={insights.hikingChallenge.target}
                  stats={insights.hikingTotal}
                />
              </div>
            )}

            {/* Kayak Achievement or In-Progress */}
            {insights?.kayakChallenge && insights.kayakChallenge.pct >= 100 ? (
              <div className="pt-[40px]">
                <AchievementBanner
                  title="Paddle Challenge"
                  label={`${qLabel} Target Achieved`}
                  current={insights.kayakChallenge.current}
                  target={insights.kayakChallenge.target}
                  extraStats={insights.kayakTotal ? [
                    { label: "Outings", value: insights.kayakTotal.count.toString() },
                    { label: "Avg Distance", value: `${insights.kayakTotal.avgDistance} mi` },
                  ] : undefined}
                />
              </div>
            ) : insights?.kayakChallenge ? (
              <div className="pt-[40px]">
                <ChallengeCard challenge={insights.kayakChallenge} />
              </div>
            ) : null}

            {/* Hiking In-Progress (if not done) */}
            {insights?.hikingChallenge && insights.hikingChallenge.pct < 100 && (
              <div className="pt-[40px]">
                <ChallengeCard challenge={insights.hikingChallenge} />
              </div>
            )}

            {/* Weekly Goals */}
            <div className="pt-[40px]">
              <SectionLabel>Weekly Goals</SectionLabel>
              <div className="px-4 space-y-2.5 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                <WeeklyCard
                  icon={<Waves className="h-5 w-5 text-fog" strokeWidth={1.5} />}
                  name="Paddle"
                  rule={`${kayakGoal} paddle / week`}
                  weekResults={insights?.quarterWeeklyGoals.kayak.weekResults ?? []}
                  total={insights?.quarterWeeklyGoals.kayak.total ?? 0}
                  streak={insights?.streaks.water ?? 0}
                  accentColor="rgba(100,160,210,0.9)"
                  missedColor="rgba(100,160,210,0.25)"
                  missedBorder="rgba(100,160,210,0.35)"
                  goal={kayakGoal}
                />
                <WeeklyCard
                  icon={<Mountain className="h-5 w-5 text-fog" strokeWidth={1.5} />}
                  name="Hiking / XC Ski"
                  rule={`${outdoorGoal} hike or XC ski / week`}
                  weekResults={insights?.quarterWeeklyGoals.outdoor.weekResults ?? []}
                  total={insights?.quarterWeeklyGoals.outdoor.total ?? 0}
                  streak={insights?.streaks.outdoor ?? 0}
                  accentColor="rgba(77,179,140,0.9)"
                  missedColor="rgba(77,179,140,0.25)"
                  missedBorder="rgba(77,179,140,0.35)"
                  goal={outdoorGoal}
                />
                <GymCard
                  rule={`${exerciseGoal} sessions / week`}
                  weekResults={insights?.quarterWeeklyGoals.classes.weekResults ?? []}
                  total={insights?.quarterWeeklyGoals.classes.total ?? 0}
                  maxPerWeek={exerciseGoal}
                  wtdClasses={insights?.wtd.classes ?? 0}
                  streak={insights?.streaks.classes ?? 0}
                  accentColor="rgba(212,106,90,0.9)"
                  missedColor="rgba(212,106,90,0.25)"
                />
              </div>
            </div>
          </div>

          {/* ── Right Column: Momentum + Insights + Distance + Milestones ── */}
          <div>
            {/* Momentum */}
            <div className="pt-[40px]">
              <SectionLabel>Momentum</SectionLabel>
              <MomentumSection
                momentum={insights?.momentum ?? null}
                wtdMiles={insights?.wtd.miles ?? 0}
                elevationGoal={profile?.goal_elevation_avg ?? 1200}
                elevationSpark={insights?.elevationSpark ?? []}
              />
            </div>

            {/* Insights */}
            <div className="pt-[40px]">
              <SectionLabel>Insights</SectionLabel>
              <InsightsList
                kayakChallenge={insights?.kayakChallenge ?? null}
                hikingChallenge={insights?.hikingChallenge ?? null}
                elevTrendPct={insights?.momentum?.elevTrendPct ?? 0}
                elevationGoal={profile?.goal_elevation_avg ?? 1200}
                fourWeekAvgElev={insights?.momentum?.fourWeekAvgElev ?? 0}
                activities={activities}
                profile={profile}
              />
            </div>

            {/* Distance Totals */}
            <div className="pt-[40px]">
              <SectionLabel>Distance</SectionLabel>
              <TotalsBar
                wtd={insights?.wtd.miles ?? 0}
                qtd={insights?.qtd.miles ?? 0}
                ytd={insights?.ytd.miles ?? 0}
                sparkWeekly={insights?.sparkWeekly}
                sparkQuarterly={insights?.sparkQuarterly}
                sparkYtd={insights?.sparkYtd}
              />
            </div>

            {/* Milestones */}
            <div className="pt-[40px]">
              <SectionLabel>Latest Milestones</SectionLabel>
              <MilestoneSpotlight />
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>
      <BottomNav />
    </div>
  );
}

/* ── Section Label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-fog px-6 mb-[16px]">
      {children}
    </div>
  );
}

/** Achievement Banner */
function AchievementBanner({ title, label, current, target, stats, extraStats }: {
  title: string; label: string; current: number; target: number;
  stats?: { count: number; avgElevation: number; maxElevation: number };
  extraStats?: { label: string; value: string }[];
}) {
  return (
    <>
      <SectionLabel>Completed</SectionLabel>
      <div className="mx-4 rounded-[14px] border border-moss p-5 relative overflow-hidden animate-fade-slide-up animate-banner-sweep"
           style={{ background: 'linear-gradient(135deg, hsl(123 20% 20%) 0%, #1a3020 100%)' }}>
        <div className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(90,125,91,0.3) 0%, transparent 70%)' }} />
        <Trophy className="h-8 w-8 text-[#c9a84c] mb-2" strokeWidth={1.5} />
        <p className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-moss-light mb-1">{label}</p>
        <h3 className="font-display text-[22px] font-bold leading-tight">{title}</h3>
        <p className="text-xs text-fog font-light mt-2">
          {current.toFixed(0)} miles — goal was {target}
        </p>
        {stats && (
          <div className="flex gap-5 mt-3.5 pt-3.5 border-t border-[rgba(90,125,91,0.25)]">
            <StatItem value={stats.count.toString()} label="Outings" />
            <StatItem value={`${stats.avgElevation.toLocaleString()} ft`} label="Avg Elev" />
            <StatItem value={`${stats.maxElevation.toLocaleString()} ft`} label="Peak Elev" />
          </div>
        )}
        {extraStats && (
          <div className="flex gap-5 mt-3.5 pt-3.5 border-t border-[rgba(90,125,91,0.25)]">
            {extraStats.map((s) => (
              <StatItem key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono-dm text-[16px] font-medium">{value}</span>
      <span className="text-[10px] text-fog uppercase tracking-[0.1em]">{label}</span>
    </div>
  );
}

/* ── Challenge Card ── */
function ChallengeCard({ challenge }: { challenge: QuarterChallenge }) {
  const animatedCurrent = useCountUp(challenge.current, 1000);
  const paceLabel = challenge.pct >= 100 ? "✓ Achieved"
    : challenge.pace === "ahead" ? "↑ Ahead of pace"
    : challenge.pace === "on_pace" ? "→ On track" : "↓ Behind pace";
  const paceColor = challenge.pct >= 100 || challenge.pace === "ahead" ? "text-moss-light bg-[rgba(122,184,124,0.12)] border-[rgba(122,184,124,0.3)]"
    : challenge.pace === "on_pace" ? "text-fog bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.1)]"
    : "text-amber bg-[rgba(212,130,58,0.12)] border-[rgba(212,130,58,0.3)]";

  return (
    <>
      <SectionLabel>In Progress</SectionLabel>
      <div className="mx-4 rounded-[14px] bg-card border border-[rgba(255,255,255,0.06)] p-5 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-display text-lg font-bold leading-tight">
            {challenge.label.replace("Challenge", "").trim()}<br />Challenge
          </h3>
          <span className={`font-mono-dm text-[10px] tracking-[0.1em] px-2 py-1 rounded-full border whitespace-nowrap ${paceColor}`}>
            {paceLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-3.5">
          <span className="font-display text-5xl font-black tracking-tight leading-none">
            {animatedCurrent.toFixed(0)}
          </span>
          <span className="font-mono-dm text-sm text-fog">/ {challenge.target}</span>
          <span className="text-[13px] text-fog font-light -ml-1">mi</span>
        </div>
        {/* Progress bar */}
        <div className="relative h-1.5 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden mb-2">
          <div
            className="h-full rounded-full relative transition-all duration-1000 ease-out"
            style={{
              width: `${challenge.pct}%`,
              background: 'linear-gradient(90deg, hsl(var(--moss)) 0%, hsl(var(--moss-light)) 100%)'
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-10 rounded-full animate-shimmer"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25))' }} />
          </div>
        </div>
        <div className="flex justify-between items-center">
          {challenge.projectedFinish && challenge.projectedFinish !== "Done!" ? (
            <span className="font-mono-dm text-[11px] text-fog">Proj. finish: {challenge.projectedFinish}</span>
          ) : <span />}
          <span className="font-mono-dm text-[11px] text-moss-light">{challenge.pct.toFixed(0)}%</span>
        </div>
      </div>
    </>
  );
}

/* ── Activity type label helper ── */
const TYPE_LABELS: Record<string, string> = {
  kayaking: "Paddle", hiking: "Hike", xc_skiing: "XC Ski",
  peloton: "Peloton", orange_theory: "OTF",
};

/* ── Week Hover Content ── */
function WeekHoverContent({ wr, weekIdx }: { wr: WeekResult; weekIdx: number }) {
  return (
    <div className="min-w-[160px]">
      <p className="font-mono-dm text-[10px] text-fog/70 tracking-[0.1em] uppercase mb-1.5">
        W{weekIdx + 1} · {wr.weekLabel}
      </p>
      {wr.activities.length === 0 ? (
        <p className="text-[11px] text-fog/50 italic">No sessions</p>
      ) : (
        <div className="space-y-1">
          {wr.activities.map((a, j) => (
            <div key={j} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-foreground">{TYPE_LABELS[a.type] ?? a.type}</span>
              <span className="font-mono-dm text-fog/60 text-[10px]">
                {a.distance ? `${a.distance} mi` : a.duration > 0 ? `${a.duration}m` : ""}
                {a.elevation ? ` · ${a.elevation} ft` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Weekly Dot Card ── */
function WeeklyCard({ icon, name, rule, weekResults, total, streak, accentColor, missedColor, missedBorder, goal = 1 }: {
  icon: React.ReactNode; name: string; rule: string; weekResults: WeekResult[]; total: number; streak: number;
  accentColor: string; missedColor: string; missedBorder: string; goal?: number;
}) {
  const totalWeeks = 13;
  return (
    <div className="rounded-[14px] bg-card border border-[rgba(255,255,255,0.06)] p-[18px_20px] press-scale">
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0">{icon}</span>
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-[11px] text-fog font-light">{rule}</p>
          </div>
        </div>
        {streak >= 3 && (
          <span className="font-mono-dm text-[10px] text-amber flex items-center gap-1.5 bg-[rgba(212,130,58,0.1)] border border-[rgba(212,130,58,0.25)] px-2 py-0.5 rounded-full tracking-[0.08em] animate-streak-glow">
            <Flame className="h-3 w-3" strokeWidth={1.5} /> {streak}-wk streak
          </span>
        )}
      </div>
      <div className="grid grid-cols-13 gap-1">
        {Array.from({ length: totalWeeks }, (_, i) => {
          const wr = i < weekResults.length ? weekResults[i] : undefined;
          const isPast = i < total - 1;
          const isCurrent = i === total - 1;
          const wasHit = wr?.hit ?? false;
          const boxStyle = isPast
            ? wasHit
              ? { backgroundColor: accentColor }
              : { backgroundColor: missedColor, border: `1px solid ${missedBorder}` }
            : isCurrent
              ? wasHit
                ? { backgroundColor: accentColor }
                : { border: `1.5px solid ${accentColor}`, background: 'transparent' }
              : { backgroundColor: 'rgba(255,255,255,0.05)' };

          if (!wr || (!isPast && !isCurrent)) {
            return (
              <div key={i}
                className={`aspect-square rounded-[3px] cursor-default animate-dot-enter ${isCurrent && !wasHit ? 'animate-pulse-dot' : ''}`}
                style={{ ...boxStyle, animationDelay: `${i * 40}ms` }}
              />
            );
          }

          return (
            <div key={i} className="relative group/tip">
              <div
                className={`aspect-square rounded-[3px] cursor-default animate-dot-enter ${isCurrent && !wasHit ? 'animate-pulse-dot' : ''}`}
                style={{ ...boxStyle, animationDelay: `${i * 40}ms` }}
              />
              <div className={`absolute bottom-full mb-2 hidden group-hover/tip:block z-50 pointer-events-none ${i <= 1 ? 'left-0' : i >= 11 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                <div className="bg-card border border-[rgba(255,255,255,0.1)] rounded-[14px] px-3 py-2 shadow-lg whitespace-nowrap">
                  <WeekHoverContent wr={wr} weekIdx={i} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-13 gap-1 mt-1">
        {Array.from({ length: totalWeeks }, (_, i) => (
          <span key={i} className="font-mono-dm text-[7px] text-center"
            style={{ color: i === total - 1 ? accentColor : undefined, opacity: i === total - 1 ? 1 : 0.5 }}>
            W{i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Gym Pip Chart Card ── */
function GymCard({ rule, weekResults, total, maxPerWeek, wtdClasses, streak, accentColor, missedColor }: {
  rule: string; weekResults: WeekResult[]; total: number; maxPerWeek: number; wtdClasses: number; streak: number;
  accentColor: string; missedColor: string;
}) {
  const totalWeeks = 13;
  return (
    <div className="rounded-[14px] bg-card border border-[rgba(255,255,255,0.06)] p-[18px_20px] press-scale">
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-fog" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium">Gym</p>
            <p className="text-[11px] text-fog font-light">{rule}</p>
          </div>
        </div>
        {streak >= 3 && (
          <span className="font-mono-dm text-[10px] text-amber flex items-center gap-1.5 bg-[rgba(212,130,58,0.1)] border border-[rgba(212,130,58,0.25)] px-2 py-0.5 rounded-full tracking-[0.08em] animate-streak-glow">
            <Flame className="h-3 w-3" strokeWidth={1.5} /> {streak}-wk streak
          </span>
        )}
      </div>
      <div className="grid grid-cols-13 gap-1 mb-1">
        {Array.from({ length: totalWeeks }, (_, weekIdx) => {
          const wr = weekIdx < weekResults.length ? weekResults[weekIdx] : undefined;
          const isPast = weekIdx < total - 1;
          const isCurrent = weekIdx === total - 1;
          const isFuture = weekIdx >= total;

          const pips = (
            <div className="flex flex-col-reverse gap-0.5 cursor-default">
              {Array.from({ length: maxPerWeek }, (_, pip) => {
                const style: React.CSSProperties = {};
                let cls = "aspect-square rounded-[2px] ";
                const isOpenCurrent = isCurrent && pip >= wtdClasses;
                if (!isOpenCurrent) cls += "animate-dot-enter ";
                if (isFuture) {
                  style.backgroundColor = "rgba(255,255,255,0.05)";
                } else if (isCurrent) {
                  if (pip < wtdClasses) {
                    style.backgroundColor = accentColor;
                  } else {
                    style.border = `1.5px solid ${accentColor}`;
                    style.background = "transparent";
                    cls += "animate-pulse-dot ";
                  }
                } else {
                  const count = wr?.count ?? 0;
                  if (pip < count) {
                    style.backgroundColor = accentColor;
                  } else {
                    style.backgroundColor = missedColor;
                    style.border = `1px solid rgba(212,106,90,0.35)`;
                  }
                }
                return <div key={pip} className={cls} style={{ ...style, animationDelay: `${weekIdx * 40}ms` }} />;
              })}
            </div>
          );

          if (!wr || isFuture) return <div key={weekIdx}>{pips}</div>;

          return (
            <div key={weekIdx} className="relative group/tip">
              {pips}
              <div className={`absolute bottom-full mb-2 hidden group-hover/tip:block z-50 pointer-events-none ${weekIdx <= 1 ? 'left-0' : weekIdx >= 11 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                <div className="bg-card border border-[rgba(255,255,255,0.1)] rounded-[14px] px-3 py-2 shadow-lg whitespace-nowrap">
                  <WeekHoverContent wr={wr} weekIdx={weekIdx} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-13 gap-1">
        {Array.from({ length: totalWeeks }, (_, i) => (
          <span key={i} className="font-mono-dm text-[7px] text-center"
            style={{ color: i === total - 1 ? accentColor : undefined, opacity: i === total - 1 ? 1 : 0.5 }}>
            W{i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Momentum Section ── */
function MomentumSection({ momentum, wtdMiles, elevationGoal, elevationSpark }: {
  momentum: MomentumData | null; wtdMiles: number; elevationGoal: number; elevationSpark: ElevSparkPoint[];
}) {
  if (!momentum) return null;
  const { fourWeekAvgMiles, fourWeekDelta, elevTrendPct, fourWeekAvgElev, priorFourWeekAvgElev, longestHikeThisQ } = momentum;
  const qLabel = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  return (
    <div className="px-4 animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="grid grid-cols-2 gap-2.5">
        <MomentumCard label="4-wk avg miles" value={fourWeekAvgMiles.toFixed(1)}>
          <p className={`font-mono-dm text-[10px] mt-1 ${fourWeekDelta >= 0 ? "text-done" : "text-amber"}`}>
            {fourWeekDelta >= 0 ? "↑" : "↓"} {Math.abs(fourWeekDelta).toFixed(1)} vs prior 4 wks
          </p>
        </MomentumCard>
        <MomentumCard
          label="Elevation trend"
          value={`${elevTrendPct > 0 ? "+" : elevTrendPct < 0 ? "−" : ""}${Math.abs(elevTrendPct)}%`}
          valueClass={elevTrendPct < 0 ? "text-amber" : undefined}
          alert={elevTrendPct < -10}
        >
          <p className="text-[11px] text-fog font-light mt-1">
            {fourWeekAvgElev.toLocaleString()} ft avg · was {priorFourWeekAvgElev.toLocaleString()} ft
          </p>
        </MomentumCard>
        <MomentumCard label={`Longest hike ${qLabel}`} value={longestHikeThisQ.toFixed(1)}>
          <p className="font-mono-dm text-[11px] text-fog mt-1">miles</p>
        </MomentumCard>
        <MomentumCard label="Week to date" value={wtdMiles.toFixed(1)}>
          <p className="font-mono-dm text-[11px] text-fog mt-1">miles</p>
        </MomentumCard>
      </div>
      {/* Elevation Sparkline */}
      {elevationSpark.length > 1 && (
        <div className="mt-2.5 bg-card border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
          <p className="font-mono-dm text-[9px] uppercase tracking-[0.18em] text-fog mb-3">Elevation per hike / xc ski</p>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={elevationSpark}>
                <defs>
                  <linearGradient id="elev-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--moss-light))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--moss-light))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as ElevSparkPoint;
                    return (
                      <div className="bg-card border border-[rgba(255,255,255,0.1)] rounded-[14px] px-3 py-2 shadow-lg">
                        <p className="font-mono-dm text-[10px] text-fog/70 tracking-[0.1em] uppercase mb-0.5">{d.date}</p>
                        <p className="text-[13px] font-medium text-foreground">{d.elev.toLocaleString()} ft</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="elev" stroke="hsl(var(--moss-light))" strokeWidth={1.5}
                      fill="url(#elev-grad)" dot={false} activeDot={{ r: 3, fill: 'hsl(var(--moss-light))', strokeWidth: 0 }} isAnimationActive animationDuration={1200} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between font-mono-dm text-[8px] text-fog/40 mt-1">
            <span>{elevationSpark[0]?.date}</span>
            <span>{elevationSpark[elevationSpark.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MomentumCard({ label, value, valueClass, alert, children }: {
  label: string; value: string; valueClass?: string; alert?: boolean; children?: React.ReactNode;
}) {
  const numericPart = parseFloat(value.replace(/[^0-9.\-]/g, '')) || 0;
  const animated = useCountUp(Math.abs(numericPart), 900);
  const prefix = value.match(/^[^0-9.\-]*/)?.[0] ?? '';
  const suffix = value.match(/[^0-9.\-]*$/)?.[0] ?? '';
  const decimals = value.includes('.') ? (value.split('.')[1]?.replace(/[^0-9]/g, '').length ?? 0) : 0;
  const displayValue = `${prefix}${animated.toFixed(decimals)}${suffix}`;

  return (
    <div className={`bg-card border rounded-[14px] p-4 press-scale ${alert ? "border-[rgba(212,130,58,0.25)]" : "border-[rgba(255,255,255,0.06)]"}`}>
      <p className="font-mono-dm text-[9px] uppercase tracking-[0.18em] text-fog mb-2">{label}</p>
      <p className={`font-display text-[32px] font-black leading-none tracking-tight ${valueClass ?? ""}`}>{displayValue}</p>
      {children}
    </div>
  );
}

/* ── Insights List ── */
function InsightsList({ kayakChallenge, hikingChallenge, elevTrendPct, elevationGoal, fourWeekAvgElev, activities, profile }: {
  kayakChallenge: QuarterChallenge | null;
  hikingChallenge: QuarterChallenge | null;
  elevTrendPct: number; elevationGoal: number; fourWeekAvgElev: number;
  activities?: Activity[]; profile?: Profile | null;
}) {
  const insights: { type: string; text: string; color: string }[] = [];

  if (kayakChallenge) {
    if (kayakChallenge.pct >= 100) {
      insights.push({ type: "Achievement", text: `Paddle goal done. ${(kayakChallenge.current - kayakChallenge.target).toFixed(0)} miles over target.`, color: "text-done" });
    } else if (kayakChallenge.pace === "ahead") {
      insights.push({ type: "Forecast", text: "Paddle is on pace to wrap up a week early.", color: "text-moss-light" });
    }
  }
  if (hikingChallenge) {
    if (hikingChallenge.pct >= 100) {
      insights.push({ type: "Achievement", text: `Hiking goal done. ${(hikingChallenge.current - hikingChallenge.target).toFixed(0)} miles over target.`, color: "text-done" });
    } else if (hikingChallenge.pace === "ahead") {
      insights.push({ type: "Forecast", text: "Hiking on pace to finish ahead of schedule.", color: "text-moss-light" });
    }
  }

  const bothDone = kayakChallenge && hikingChallenge && kayakChallenge.pct >= 100 && hikingChallenge.pct >= 100;
  if (bothDone) {
    const totalMiles = Math.round(kayakChallenge.current + hikingChallenge.current);
    const nextMilestone = Math.ceil(totalMiles / 25) * 25;
    if (nextMilestone > totalMiles) {
      insights.push({ type: "Stretch Goal", text: `Both targets crushed! You're at ${totalMiles} combined miles — push for ${nextMilestone}?`, color: "text-amber" });
    } else {
      insights.push({ type: "Stretch Goal", text: `Both targets crushed! Keep stacking miles this quarter.`, color: "text-amber" });
    }
  } else if (kayakChallenge && hikingChallenge && kayakChallenge.pace !== "behind" && hikingChallenge.pace !== "behind") {
    insights.push({ type: "Flexibility", text: "Skipping next week still keeps you on track.", color: "text-fog" });
  }

  if (elevTrendPct < -10) {
    insights.push({ type: "Watch", text: `Elevation down ${Math.abs(elevTrendPct)}% over 4 weeks. Consider a hillier route this weekend.`, color: "text-amber" });
  } else if (fourWeekAvgElev >= elevationGoal) {
    insights.push({ type: "Strong", text: "Elevation avg exceeding target — strong climbing!", color: "text-moss-light" });
  }

  // ── Prior quarter carryover when no insights generated yet ──
  if (insights.length === 0 && activities && profile) {
    const now = new Date();
    const currentQStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const prevQEnd = currentQStart;
    const prevQStart = new Date(currentQStart.getFullYear(), currentQStart.getMonth() - 3, 1);
    const prevQLabel = `Q${Math.floor(prevQStart.getMonth() / 3) + 1}`;

    const prevLogs = activities.filter(a => {
      const t = new Date(a.start_time).getTime();
      return t >= prevQStart.getTime() && t < prevQEnd.getTime();
    });

    if (prevLogs.length > 0) {
      const hikingMiles = prevLogs.filter(a => a.type === "hiking" || a.type === "xc_skiing").reduce((s, a) => s + (a.distance || 0), 0);
      const kayakMiles = prevLogs.filter(a => a.type === "kayaking").reduce((s, a) => s + (a.distance || 0), 0);
      const hikingTarget = profile.goal_hiking_quarterly_miles ?? 60;
      const kayakTarget = profile.goal_kayak_quarterly_miles ?? 90;

      // Find the weakest area from last quarter
      const gaps: { area: string; pct: number; tip: string }[] = [];
      if (hikingMiles < hikingTarget) {
        gaps.push({ area: "Hiking", pct: Math.round((hikingMiles / hikingTarget) * 100), tip: "getting more trail miles in early" });
      }
      if (kayakMiles < kayakTarget) {
        gaps.push({ area: "Paddling", pct: Math.round((kayakMiles / kayakTarget) * 100), tip: "building paddle volume earlier in the quarter" });
      }

      // Check gym/outdoor consistency
      const weeks = 13;
      const firstMonday = startOfWeek(prevQStart, { weekStartsOn: 1 });
      let gymHit = 0, outdoorHit = 0, kayakHit = 0;
      for (let i = 0; i < weeks; i++) {
        const ws = new Date(firstMonday.getTime() + i * 7 * 86400000);
        const we = new Date(ws.getTime() + 7 * 86400000);
        const effectiveStart = Math.max(ws.getTime(), prevQStart.getTime());
        const wLogs = prevLogs.filter(a => { const t = new Date(a.start_time).getTime(); return t >= effectiveStart && t < we.getTime(); });
        if (wLogs.filter(a => ["peloton", "orange_theory"].includes(a.type)).length >= (profile.goal_exercises_per_week ?? 3)) gymHit++;
        if (wLogs.filter(a => ["hiking", "xc_skiing"].includes(a.type)).length >= (profile.goal_outdoor_per_week ?? 1)) outdoorHit++;
        if (wLogs.filter(a => a.type === "kayaking").length >= (profile.goal_kayak_per_week ?? 1)) kayakHit++;
      }
      const gymPct = Math.round((gymHit / weeks) * 100);
      const outdoorPct = Math.round((outdoorHit / weeks) * 100);
      const kayakPct = Math.round((kayakHit / weeks) * 100);

      if (gymPct < 60) gaps.push({ area: "Gym consistency", pct: gymPct, tip: "locking in gym sessions early each week" });
      if (outdoorPct < 60) gaps.push({ area: "Hike / XC Ski rhythm", pct: outdoorPct, tip: "scheduling a weekly hike or XC ski outing" });
      if (kayakPct < 60) gaps.push({ area: "Paddle rhythm", pct: kayakPct, tip: "getting on the water more regularly" });

      // Pick the biggest gap
      gaps.sort((a, b) => a.pct - b.pct);
      if (gaps.length > 0) {
        const top = gaps[0];
        insights.push({ type: `${prevQLabel} Learning`, text: `${top.area} was at ${top.pct}% last quarter. Focus: ${top.tip}.`, color: "text-amber" });
      }
      if (gaps.length > 1) {
        const second = gaps[1];
        insights.push({ type: `${prevQLabel} Learning`, text: `${second.area} hit ${second.pct}%. Try ${second.tip}.`, color: "text-fog" });
      }
    }
  }

  if (insights.length === 0) {
    insights.push({ type: "Status", text: "Steady across the board. Nice consistency!", color: "text-fog" });
  }

  return (
    <div className="mx-4 bg-card border border-[rgba(255,255,255,0.06)] rounded-[14px] overflow-hidden animate-fade-slide-up" style={{ animationDelay: '0.35s' }}>
      {insights.slice(0, 4).map((insight, i) => (
        <div key={i} className={`flex items-start gap-3 px-[18px] py-3.5 ${i < insights.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}>
          <span className={`text-sm mt-0.5 flex-shrink-0 ${insight.color}`}>●</span>
          <div>
            <p className="font-mono-dm text-[9px] uppercase tracking-[0.15em] text-fog mb-0.5">{insight.type}</p>
            <p className="text-[13px] leading-relaxed font-light text-mist">{insight.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Totals Bar ── */
function TotalsBar({ wtd, qtd, ytd, sparkWeekly, sparkQuarterly, sparkYtd }: {
  wtd: number; qtd: number; ytd: number;
  sparkWeekly?: SparkPoint[]; sparkQuarterly?: SparkPoint[]; sparkYtd?: SparkPoint[];
}) {
  return (
    <div className="mx-4 bg-card border border-[rgba(255,255,255,0.06)] rounded-[14px] grid grid-cols-3 overflow-hidden animate-fade-slide-up" style={{ animationDelay: '0.45s' }}>
      <TotalItem label="Week" value={wtd.toFixed(1)} spark={sparkWeekly} />
      <TotalItem label="Quarter" value={qtd.toFixed(0)} spark={sparkQuarterly} border />
      <TotalItem label="Year" value={ytd.toFixed(0)} spark={sparkYtd} />
    </div>
  );
}

function TotalItem({ label, value, spark, border }: {
  label: string; value: string; spark?: SparkPoint[]; border?: boolean;
}) {
  return (
    <div className={`p-4 pb-3.5 flex flex-col relative ${border ? "border-x border-[rgba(255,255,255,0.07)]" : ""}`}>
      <p className="font-mono-dm text-[9px] uppercase tracking-[0.15em] text-fog mb-1.5">{label}</p>
      <p className="font-display text-2xl font-black leading-none tracking-tight">{value}</p>
      <p className="font-mono-dm text-[10px] text-fog mt-0.5 mb-2">mi</p>
      {spark && spark.length > 1 && (
        <div className="h-7 mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <defs>
                <linearGradient id={`sp-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--moss-light))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--moss-light))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="miles" stroke="hsl(var(--moss-light))" strokeWidth={1.5}
                    fill={`url(#sp-${label})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── Milestone Spotlight ── */
function MilestoneSpotlight() {
  const { data: achieved } = useAchievedMilestones(3);
  const { data: evidenceMap } = useMilestoneEvidence(achieved);

  return (
    <div className="mx-4 animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
      {!achieved || achieved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Target className="h-8 w-8 text-fog/40 mb-2" />
          <p className="text-sm text-fog mb-2">No milestones unlocked yet!</p>
          <Link to="/targets" className="text-sm font-semibold text-moss-light hover:underline">
            View milestones →
          </Link>
        </div>
      ) : (
        <div>
          {[...achieved].sort((a, b) => {
            const latestDate = (p: typeof a) => {
              const ev = evidenceMap?.get(p.id);
              const evDate = ev?.[0]?.start_time;
              return evDate ? new Date(evDate).getTime() : p.achieved_at ? new Date(p.achieved_at).getTime() : 0;
            };
            return latestDate(b) - latestDate(a);
          }).map((p) => {
            const ms = p.skill_milestones;
            const evidenceList = evidenceMap?.get(p.id);
            return (
              <div key={p.id} className="relative group/tip flex items-center gap-3.5 py-3.5 border-b border-[rgba(255,255,255,0.05)] last:border-0 cursor-default">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] border-done animate-unlock-pop"
                     style={{ background: 'rgba(74,155,92,0.15)' }}>
                  <CheckCircle2 className="h-3 w-3 text-done" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] font-normal text-mist flex-1">{ms?.title}</span>
                {(() => {
                  const latest = evidenceList?.[0];
                  const displayDate = latest?.start_time ? new Date(latest.start_time) : p.achieved_at ? new Date(p.achieved_at) : null;
                  return displayDate ? (
                    <span className="font-mono-dm text-[10px] text-fog tracking-[0.08em] flex-shrink-0">
                      {format(displayDate, "MMM d")}
                    </span>
                  ) : null;
                })()}
                {/* Hover tooltip — latest evidence */}
                {(() => {
                  const latest = evidenceList?.[0];
                  if (!latest) return null;
                  const detail = [latest.route, latest.elevation_gain != null ? `${latest.elevation_gain.toLocaleString()} ft` : null, latest.distance != null ? `${latest.distance} mi` : null].filter(Boolean).join(", ");
                  return detail ? (
                    <div className="hidden group-hover/tip:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      bg-card border border-[rgba(255,255,255,0.1)] rounded-[14px] px-3 py-2 shadow-lg max-w-[220px]">
                      <p className="text-[12px] text-mist leading-snug">{detail}</p>
                      {latest.start_time && (
                        <p className="font-mono-dm text-[10px] text-done mt-0.5">
                          {format(new Date(latest.start_time), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
