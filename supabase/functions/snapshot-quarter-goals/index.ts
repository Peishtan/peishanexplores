import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Determine which quarter just ended
    // This runs on the 1st of a new quarter, so "last quarter" is the one that just closed
    const now = new Date();
    let year = now.getFullYear();
    let quarter = Math.floor(now.getMonth() / 3); // 0-based current quarter minus 1 = last quarter
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }

    // Allow override via body (for manual triggers / backfills)
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.year && body.quarter) {
          year = body.year;
          quarter = body.quarter;
        }
      } catch { /* use defaults */ }
    }

    console.log(`Snapshotting goals for Q${quarter} ${year}`);

    // Get all profiles
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, goal_hiking_quarterly_miles, goal_kayak_quarterly_miles, goal_elevation_avg, goal_exercises_per_week, goal_outdoor_per_week, goal_kayak_per_week");

    if (profileErr) throw profileErr;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles to snapshot" }), { status: 200 });
    }

    // Upsert snapshots (idempotent)
    const rows = profiles.map((p) => ({
      user_id: p.user_id,
      year,
      quarter,
      goal_hiking_quarterly_miles: p.goal_hiking_quarterly_miles ?? 60,
      goal_kayak_quarterly_miles: p.goal_kayak_quarterly_miles ?? 90,
      goal_elevation_avg: p.goal_elevation_avg ?? 1200,
      goal_exercises_per_week: p.goal_exercises_per_week ?? 3,
      goal_outdoor_per_week: p.goal_outdoor_per_week ?? 1,
      goal_kayak_per_week: p.goal_kayak_per_week ?? 1,
    }));

    const { error: upsertErr } = await supabase
      .from("quarter_goal_snapshots")
      .upsert(rows, { onConflict: "user_id,year,quarter" });

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ message: `Snapshotted ${rows.length} profiles for Q${quarter} ${year}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
