# PS FitTrackr

A bespoke fitness performance dashboard for multi-sport endurance athletes. Tracks paddling, hiking, XC skiing, and strength training across 13-week quarterly cycles — with a focus on consistency, skill progression, and momentum rather than raw volume.

---

## Why It Exists

Most fitness apps optimize for streaks and step counts. PS FitTrackr is built around a different set of questions: *Am I trending up or losing steam? Am I hitting my weekly rhythm? Have I unlocked the next level of physical capability?*

Three principles shape every design decision:

**Quarterly cycles.** Fitness targets run in 13-week blocks aligned to seasonal outdoor objectives (Q1 Jan–Mar, Q2 Apr–Jun, etc.). A quarter is long enough to build real fitness. Short enough to stay honest.

**Weekly rhythm.** The app tracks binary completion of weekly habits — 1 paddle/week, 3 gym sessions/week — not just cumulative distance. Showing up consistently matters more than occasional big efforts.

**Skill milestones.** Progression unlocks specific physical achievements organized by difficulty (Beginner → Intermediate → Advanced). A 10-mile hike. 2,000 ft of elevation on a single outing. A 15-mile paddle. These move the focus from vanity metrics to functional capability.

---

## Screens

| Dashboard | Logs | Targets | Scorecard |
|-----------|------|---------|-----------|
| Quarterly momentum, rolling averages, weekly habits | Full activity history with filters & heatmap | Quarterly goals + milestone tracker | Season review with weighted consistency score |

---

## Key Features

### Momentum Engine
Calculates a 4-week rolling average for mileage and elevation. More useful than year-to-date totals — it shows whether fitness is building or declining right now. Includes an elevation-per-outing area chart (visible with 2+ data points).

### Multi-Sport Tracking
- **Paddling** — distance and outing frequency (covers kayaking, SUP, etc.)
- **Hiking / XC Ski** — vertical gain and weekly consistency
- **Gym** — session count as the injury-prevention baseline

### Challenge Cards
Quarterly mileage challenges for Paddling and Hiking/XC Ski with pace tracking (ahead / on track / behind), projected finish dates, and achievement banners with stats when targets are met. When both targets are met, a Stretch Goal insight suggests combined mileage milestones in 25-mile increments.

### Weekly Goal Tracking
A 13-column dot grid per sport showing weekly goal completion across the quarter. Streak badges (🔥) appear at 3+ consecutive weeks. The Gym card uses a pip chart showing individual sessions per week against the target.

### Automated Scorecard
Each quarter generates a weighted percentage score based on:
- **40%** Distance targets hit
- **20%** Gym consistency
- **20%** Outdoor / Paddle rhythm (with a 75% floor when the corresponding distance target is met)
- **10%** Average elevation gain vs target (avg ft/outing compared to elevation goal)
- **10%** Milestones unlocked *this quarter* (quarter-scoped — a milestone counts if any qualifying evidence activity falls within the quarter, so repeating a 10-mile hike in a new quarter earns the score again)

Includes a sport mix donut chart, collapsible score formula breakdown, and a dynamic review section. Past quarters are accessible via a dropdown selector and scored against the goals that were active at the time (via snapshots).

#### Progression Trend
The review compares the first half and second half of the quarter for average distance and elevation per outing. If either metric improves by >15%, the review highlights "building momentum." If either drops by >20%, it flags the decline with an actionable suggestion. This surfaces whether fitness is trending up or fading — a question raw totals don't answer.

#### Trade-Off Aware Review
The "Biggest lever" insight and consistency gap critiques use cross-category analysis before generating feedback. When a category (e.g., gym) has low consistency, the system checks whether missed weeks coincided with overflow sessions in other categories (e.g., extra hikes or paddles that same week). If the overlap is significant (≥40% of missed weeks), the review acknowledges the trade-off — framing it as "high-volume outdoor weeks crowding out gym sessions" rather than a generic consistency failure. This prevents misleading critiques when a big adventure week naturally displaces a gym day. The same logic applies in reverse for outdoor/paddle gaps with gym overflow.

#### Recovery Awareness (Dashboard)
The weekly Insights card on the Dashboard flags overtraining risk when the current week has ≥6 total sessions or ≥4 high/extreme intensity sessions. This provides real-time coaching nudges ("consider a rest day") rather than waiting for the end-of-quarter scorecard to surface load issues.

#### Overflow Indicators (Dashboard)
The weekly rhythm heat map shows a single success block per week per category. When sessions exceed the weekly target, the block displays the total count (e.g., "3") centered inside it using a subtle dark overlay, rather than adding extra blocks. This keeps the grid scannable while surfacing high-volume weeks that explain trade-offs in adjacent rows.

### Skill Milestones
Achievements unlock as real physical benchmarks are hit — not based on time or streaks. Organized into Beginner, Intermediate, and Advanced tiers:
- **Beginner:** 10-mile hike, 2,000 ft hike, 10-mile paddle
- **Intermediate:** 15-mile hike, 3,000 ft hike, 15-mile paddle
- **Advanced:** 20-mile hike, 5,000 ft hike, 20-mile paddle

Milestones are recomputed automatically whenever activities are added, edited, or deleted. The dashboard spotlight prioritizes higher-tier achievements when milestones share the same date.

### Activity Logging
Activities are logged via an inline form on the Logs page with sport type, date, distance, elevation gain, route name, and notes. Cards feature sport-colored left borders, prominent distance typography, and tap-to-expand edit/delete actions on mobile. A 90-day activity heatmap is shown above the list. Data can be exported to CSV.

---

## Automated Behaviors

### Quarter Transitions
On the 1st day of each new quarter (Apr 1, Jul 1, Oct 1, Jan 1):
- **Dashboard resets** — all QTD metrics, challenge cards, weekly goal dots, and momentum calculations shift to the new quarter's data
- **Scorecard updates** — the new quarter becomes "Current" and the prior quarter moves to the dropdown for review
- **Goal snapshots are taken** — a cron job automatically snapshots each user's targets (quarterly mileage, weekly session goals, elevation targets) into the `quarter_goal_snapshots` table, ensuring past quarter scorecards are evaluated against the goals that were active during that quarter, not the current ones

### Prior Quarter Insights
When a new quarter starts and there's not yet enough data to generate current-quarter insights, the Dashboard Insights section surfaces 1–2 learnings from the prior quarter (e.g., *"Paddling was at 45% last quarter. Focus: building paddle volume earlier."*). These are derived by analyzing missed targets and weak consistency areas from the previous 13-week block.

### Milestone Recomputation
Skill milestones are evaluated via a backend function triggered on every activity change (add, edit, delete). Progress is linked to evidence log IDs and achievements use the actual timestamp of the qualifying activity. Evaluations for quarterly windows use calendar quarters (Q1 = Jan–Mar, etc.).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + TypeScript, Vite, Tailwind CSS |
| Backend / DB | Lovable Cloud (Supabase — auth, real-time sync, relational storage) |
| Styling | Dark-mode editorial design — high information density with generous negative space |
| Logic | Custom hooks in `src/hooks/` for momentum calculations, trend analysis, and scorecard computation |
| Scheduled Jobs | pg_cron + Edge Functions for quarterly goal snapshotting |

---

## Project Structure

```
src/
├── components/         # Reusable UI: charts, milestone cards, log entries
├── hooks/              # Business logic: quarterly aggregation, trend analysis
│   ├── useActivities   # CRUD operations for activity logs
│   ├── useDashboardInsights  # Momentum, streaks, challenges, sparklines
│   ├── useScorecardData      # Weighted quarterly scoring engine
│   └── useSkillMilestones    # Milestone progress and recomputation
├── integrations/
│   └── supabase/       # Client config and auto-generated schema types
├── lib/                # Shared utilities
└── pages/
    ├── Dashboard.tsx   # Quarterly overview, momentum, weekly habits, insights
    ├── Activities.tsx  # Full activity log with sport/date filters and heatmap
    ├── Targets.tsx     # Quarterly goal setting, pacing model, milestone tracking
    ├── Scorecard.tsx   # Season review with weighted score and quarter selector
    ├── Benchmarks.tsx  # Personal bests and comparative data
    └── Onboarding.tsx  # First-run goal setup

supabase/
├── functions/
│   ├── recompute-milestones/  # Evaluates milestone progress on activity changes
│   └── snapshot-quarter-goals/ # Captures goal state at quarter boundaries
└── config.toml
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `activities` | All logged activities with type, distance, elevation, duration |
| `profiles` | User goals and preferences (weekly targets, quarterly mileage targets) |
| `skill_milestones` | Definition of milestone benchmarks (thresholds, types, windows) |
| `skill_milestone_progress` | Per-user progress against each milestone |
| `quarter_goal_snapshots` | Frozen copy of goals at each quarter boundary |
| `benchmarks` | Physical fitness test results (rowing, push-ups, planks) |
| `weight_entries` | Body weight tracking over time |

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

---

## Status

Active development. Currently tracking Q1 2026 — Week 13. Q2 transition scheduled for April 1.
