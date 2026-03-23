# PS FitTrackr

A bespoke fitness performance dashboard for multi-sport endurance athletes. Tracks sea kayaking, hiking, XC skiing, and strength training across 12-week quarterly cycles — with a focus on consistency, skill progression, and momentum rather than raw volume.

---

## Why It Exists

Most fitness apps optimize for streaks and step counts. PS FitTrackr is built around a different set of questions: *Am I trending up or losing steam? Am I hitting my weekly rhythm? Have I unlocked the next level of physical capability?*

Three principles shape every design decision:

**Quarterly cycles.** Fitness targets run in 12-week blocks aligned to seasonal outdoor objectives (Q1 Jan–Mar, Q2 Apr–Jun, etc.). A quarter is long enough to build real fitness. Short enough to stay honest.

**Weekly rhythm.** The app tracks binary completion of weekly habits — 1 paddle/week, 3 gym sessions/week — not just cumulative distance. Showing up consistently matters more than occasional big efforts.

**Skill milestones.** Progression unlocks specific physical achievements organized by difficulty (Beginner → Intermediate → Advanced). A 10-mile hike. 2,000 ft of elevation on a single outing. A 15-mile paddle. These move the focus from vanity metrics to functional capability.

---

## Screens

| Dashboard | Logs | Targets | Scorecard |
|-----------|------|---------|-----------|
| Q1 momentum, rolling averages, weekly habits | Full activity history with filters | Quarterly goals + milestone tracker | Season review with consistency score |

---

## Key Features

### Momentum Engine
Calculates a 4-week rolling average for mileage and elevation. More useful than year-to-date totals — it shows whether fitness is building or declining right now.

### Multi-Sport Tracking
- **Sea Kayaking** — distance and outing frequency
- **Hiking / XC Ski** — vertical gain and weekly consistency
- **Gym** — session count as the injury-prevention baseline

### Automated Scorecard
Each quarter generates a weighted percentage score (e.g. *84% — Strong*) based on distance targets hit, milestones unlocked, and weekly rhythm adherence. The scorecard surfaces the single biggest lever to improve next quarter.

### Skill Milestones
Achievements unlock as real physical benchmarks are hit — not based on time or streaks. Organized into Beginner, Intermediate, and Advanced tiers across hiking, paddling, and elevation.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + TypeScript, Vite |
| Backend / DB | Supabase (auth, real-time sync, relational storage) |
| Styling | Dark-mode, high-contrast CSS — information density without clutter |
| Logic | Custom hooks in `src/hooks` for momentum calculations and trend analysis |

---

## Project Structure

```
src/
├── components/         # Reusable UI: charts, milestone cards, log entries
├── hooks/              # Business logic: quarterly aggregation, trend analysis
├── integrations/
│   └── supabase/       # Client config and schema definitions
├── lib/                # Shared utilities
└── pages/
    ├── Dashboard.tsx   # Q1 overview, momentum metrics, weekly habits
    ├── Activities.tsx  # Full activity log with sport and date filters
    ├── Targets.tsx     # Quarterly goal setting and milestone tracking
    ├── Scorecard.tsx   # Season review and consistency score
    ├── Benchmarks.tsx  # Personal bests and comparative data
    └── Onboarding.tsx  # First-run setup
```

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/your-username/ps-fittrackr.git
cd ps-fittrackr
bun install          # or npm install

# Configure environment
cp .env.example .env
# Add your Supabase URL and anon key to .env

# Run locally
bun run dev
```

Requires a [Supabase](https://supabase.com) project. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env`.

---

## Status

Active development. Currently tracking Q1 2026 — Week 13.
