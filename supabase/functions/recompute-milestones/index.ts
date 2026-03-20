import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from token using service role client
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Rate limit: check last recompute time
    const { data: lastProgress } = await supabase
      .from("skill_milestone_progress")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastProgress?.updated_at) {
      const elapsed = Date.now() - new Date(lastProgress.updated_at).getTime();
      if (elapsed < 10000) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a few seconds." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch all active milestones
    const { data: milestones, error: mErr } = await supabase
      .from("skill_milestones")
      .select("*")
      .eq("is_active", true);
    if (mErr) throw mErr;

    // Fetch all user activities
    const { data: activities, error: aErr } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: false });
    if (aErr) throw aErr;

    // Fetch user profile for quarterly targets
    const { data: profile } = await supabase
      .from("profiles")
      .select("goal_kayak_quarterly_miles, goal_hiking_quarterly_miles, goal_elevation_avg")
      .eq("user_id", userId)
      .maybeSingle();

    // Map activity_type enum values to milestone activity types
    const activityTypeMap: Record<string, string> = {
      kayaking: "kayak",
      hiking: "hike",
      xc_skiing: "ski",
      peloton: "gym",
      orange_theory: "gym",
    };

    const now = new Date();
    const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const currentQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0, 23, 59, 59);

    // Helper: filter activities by type and window
    function filterByWindow(acts: any[], milestone: any) {
      let filtered = acts.filter(
        (a: any) => activityTypeMap[a.type] === milestone.activity_type
      );

      if (milestone.window_type === "quarter") {
        filtered = filtered.filter((a: any) => {
          const d = new Date(a.start_time);
          return d >= currentQuarterStart && d <= currentQuarterEnd;
        });
      } else if (milestone.window_type === "rolling_days" && milestone.window_days) {
        const cutoff = new Date(now.getTime() - milestone.window_days * 86400000);
        filtered = filtered.filter((a: any) => new Date(a.start_time) >= cutoff);
      }
      // all_time: no filter

      return filtered;
    }

    // Monday-aligned week number
    function getWeekKey(date: Date): string {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    }

    const results: any[] = [];

    for (const ms of milestones!) {
      let progressCurrent = 0;
      let progressTarget = 1;
      let status = "locked";
      let achievedAt: string | null = null;
      let evidenceLogIds: string[] = [];

      switch (ms.milestone_type) {
        case "COUNT_ACTIVITIES_OVER_DISTANCE": {
          const qualifying = filterByWindow(activities!, ms).filter(
            (a: any) => (a.distance ?? 0) >= (ms.threshold_distance_mi ?? 0)
          );
          progressTarget = ms.threshold_count ?? 1;
          progressCurrent = qualifying.length;
          evidenceLogIds = qualifying.slice(0, progressTarget).map((a: any) => a.id);
          break;
        }

        case "COUNT_ACTIVITIES_OVER_ELEVATION": {
          const qualifying = filterByWindow(activities!, ms).filter(
            (a: any) => (a.elevation_gain ?? 0) >= (ms.threshold_elevation_ft ?? 0)
          );
          progressTarget = ms.threshold_count ?? 1;
          progressCurrent = qualifying.length;
          evidenceLogIds = qualifying.slice(0, progressTarget).map((a: any) => a.id);
          break;
        }

        case "SINGLE_ACTIVITY_OVER_ELEVATION": {
          const qualifying = filterByWindow(activities!, ms).filter(
            (a: any) => (a.elevation_gain ?? 0) >= (ms.threshold_elevation_ft ?? 0)
          );
          progressTarget = 1;
          progressCurrent = qualifying.length > 0 ? 1 : 0;
          if (qualifying.length > 0) {
            // Pick best (highest elevation)
            qualifying.sort((a: any, b: any) => (b.elevation_gain ?? 0) - (a.elevation_gain ?? 0));
            evidenceLogIds = [qualifying[0].id];
          }
          break;
        }

        case "SINGLE_ACTIVITY_OVER_DISTANCE": {
          const qualifying = filterByWindow(activities!, ms).filter(
            (a: any) => (a.distance ?? 0) >= (ms.threshold_distance_mi ?? 0)
          );
          progressTarget = 1;
          progressCurrent = qualifying.length > 0 ? 1 : 0;
          if (qualifying.length > 0) {
            qualifying.sort((a: any, b: any) => (b.distance ?? 0) - (a.distance ?? 0));
            evidenceLogIds = [qualifying[0].id];
          }
          break;
        }

        case "STREAK_WEEKLY_MINIMUM": {
          const acts = filterByWindow(activities!, ms);
          const weekMap = new Map<string, any[]>();
          for (const a of acts) {
            const wk = getWeekKey(new Date(a.start_time));
            if (!weekMap.has(wk)) weekMap.set(wk, []);
            weekMap.get(wk)!.push(a);
          }

          const currentWeekKey = getWeekKey(now);
          let streak = 0;
          const streakEvidence: string[] = [];
          const d = new Date(now);
          const dayOfWeek = d.getDay();
          const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          d.setDate(d.getDate() + mondayDiff);
          d.setHours(0, 0, 0, 0);

          while (true) {
            const wk = d.toISOString().slice(0, 10);
            const logs = weekMap.get(wk);
            if (logs && logs.length > 0) {
              streak++;
              streakEvidence.push(logs[0].id);
              d.setDate(d.getDate() - 7);
            } else {
              if (wk === currentWeekKey && streak === 0) {
                d.setDate(d.getDate() - 7);
                continue;
              }
              break;
            }
          }

          progressTarget = ms.threshold_count ?? 1;
          progressCurrent = streak;
          evidenceLogIds = streakEvidence;
          break;
        }

        case "QUARTERLY_DISTANCE_TARGET": {
          const quarterActs = filterByWindow(activities!, ms);
          const totalDistance = quarterActs.reduce((sum: number, a: any) => sum + (a.distance ?? 0), 0);

          // Get target from profile based on activity_type
          let target = 0;
          if (ms.activity_type === "kayak") {
            target = profile?.goal_kayak_quarterly_miles ?? 90;
          } else if (ms.activity_type === "hike") {
            target = profile?.goal_hiking_quarterly_miles ?? 60;
          }

          progressTarget = target;
          progressCurrent = Math.round(totalDistance);
          evidenceLogIds = quarterActs.slice(0, 10).map((a: any) => a.id);
          break;
        }

        case "QUARTERLY_ELEVATION_AVG_TARGET": {
          // Filter hikes + xc_skiing in quarter that have elevation
          const quarterActs = filterByWindow(activities!, ms).filter(
            (a: any) => (a.elevation_gain ?? 0) > 0
          );
          const avgElev = quarterActs.length > 0
            ? quarterActs.reduce((sum: number, a: any) => sum + (a.elevation_gain ?? 0), 0) / quarterActs.length
            : 0;

          const target = profile?.goal_elevation_avg ?? 1200;
          progressTarget = target;
          progressCurrent = Math.round(avgElev);
          evidenceLogIds = quarterActs.slice(0, 10).map((a: any) => a.id);
          break;
        }
      }

      status = progressCurrent >= progressTarget ? "achieved" : progressCurrent > 0 ? "in_progress" : "locked";

      // Check existing progress to preserve achieved_at
      const { data: existing } = await supabase
        .from("skill_milestone_progress")
        .select("achieved_at")
        .eq("user_id", userId)
        .eq("milestone_id", ms.id)
        .maybeSingle();

      if (status === "achieved") {
        // Use the date of the qualifying activity rather than recompute time
        if (existing?.achieved_at) {
          achievedAt = existing.achieved_at;
        } else if (evidenceLogIds.length > 0) {
          const evidenceActivity = activities!.find((a: any) => a.id === evidenceLogIds[0]);
          achievedAt = evidenceActivity?.start_time || new Date().toISOString();
        } else {
          achievedAt = new Date().toISOString();
        }
      }

      results.push({
        user_id: userId,
        milestone_id: ms.id,
        status,
        progress_current: progressCurrent,
        progress_target: progressTarget,
        achieved_at: achievedAt,
        evidence_log_ids: evidenceLogIds,
        updated_at: new Date().toISOString(),
      });
    }

    // Upsert all progress
    for (const r of results) {
      const { error: upsertErr } = await supabase
        .from("skill_milestone_progress")
        .upsert(r, { onConflict: "user_id,milestone_id" });
      if (upsertErr) {
        console.error("Upsert error for milestone", r.milestone_id, upsertErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, updated: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("recompute-milestones error:", err);
    return new Response(JSON.stringify({ error: "Internal server error. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
