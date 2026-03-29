import html2canvas from "html2canvas";
import type { ScorecardData } from "@/hooks/useScorecardData";

// Elevation landmarks
const LANDMARKS = [
  { name: "Mt. Olympus", ft: 7980 },
  { name: "Mt. St. Helens", ft: 8363 },
  { name: "Mt. Baker", ft: 10781 },
  { name: "Mt. Hood", ft: 11249 },
  { name: "Mt. Adams", ft: 12281 },
  { name: "Mt. Rainier", ft: 14411 },
  { name: "Everest Base Camp", ft: 17598 },
  { name: "Kilimanjaro", ft: 19341 },
  { name: "Denali", ft: 20310 },
  { name: "Everest", ft: 29032 },
];

function getElevationNote(totalElev: number): string | null {
  if (totalElev <= 0) return null;
  const passed = LANDMARKS.filter(l => totalElev >= l.ft).sort((a, b) => b.ft - a.ft);
  if (passed.length > 0) return `${totalElev.toLocaleString()} ft climbed — past ${passed[0].name}`;
  const next = LANDMARKS.filter(l => totalElev < l.ft).sort((a, b) => a.ft - b.ft);
  if (next.length > 0) return `${totalElev.toLocaleString()} ft — ${(next[0].ft - totalElev).toLocaleString()} ft to ${next[0].name}`;
  return null;
}

function computeScore(sc: ScorecardData): { score: number; label: string } {
  const targetsHit = sc.targets.filter(t => t.hit).length;
  const targetScore = (targetsHit / Math.max(sc.targets.length, 1)) * 100;
  const gymPct = sc.consistency.find(c => c.label === "Gym Sessions")?.pct ?? 0;
  const outdoorCons = sc.consistency.find(c => c.label === "Outdoor Sessions");
  const kayakCons = sc.consistency.find(c => c.label === "Paddle Sessions");
  const hikingHit = sc.targets.find(t => t.label.includes("Hiking"))?.hit ?? false;
  const kayakHit = sc.targets.find(t => t.label.includes("Paddle"))?.hit ?? false;
  const outdoorPct = hikingHit ? Math.max(outdoorCons?.pct ?? 0, 75) : (outdoorCons?.pct ?? 0);
  const kayakPct = kayakHit ? Math.max(kayakCons?.pct ?? 0, 75) : (kayakCons?.pct ?? 0);
  const depScore = (outdoorPct + kayakPct) / 2;
  const milestoneScore = sc.totalMilestones > 0
    ? Math.min((sc.milestonesUnlocked / sc.totalMilestones) * 100, 100) : 100;
  const elevationScore = sc._elevationTarget > 0
    ? Math.min((sc._avgElevation / sc._elevationTarget) * 100, 100) : 100;
  const score = Math.round(targetScore * 0.40 + gymPct * 0.20 + depScore * 0.20 + elevationScore * 0.10 + milestoneScore * 0.10);
  const label = score >= 93 ? "Outstanding" : score >= 87 ? "Excellent" : score >= 80 ? "Strong"
    : score >= 73 ? "Solid" : score >= 60 ? "Building" : "Getting Started";
  return { score, label };
}

/** Build the share card HTML — mirrors the Scorecard page components exactly */
function buildShareHTML(sc: ScorecardData): string {
  const { score, label: scoreLabel } = computeScore(sc);
  
  const targetsHit = sc.targets.filter(t => t.hit).length;
  const elevNote = getElevationNote(sc.totalElevation);

  const sportColors: Record<string, string> = {
    hiking: "hsl(145, 50%, 52%)",
    kayaking: "hsl(200, 60%, 55%)",
    xc_skiing: "hsl(240, 30%, 72%)",
    gym: "#d46a5a",
  };

  return `
<div id="share-card" style="width:1080px;height:1920px;background:hsl(150,8%,5%);color:hsl(35,30%,93%);font-family:'DM Sans',system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;">

  <!-- Mountain Header -->
  <div style="position:relative;height:180px;overflow:hidden;">
    <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1a2e1c 0%,#0d1a10 40%,#0a1215 100%);"></div>
    <svg style="position:absolute;bottom:0;left:0;width:100%;height:120px;" viewBox="0 0 1080 120" preserveAspectRatio="none">
      <path d="M0 120 L0 70 L100 40 L200 60 L300 15 L400 45 L540 5 L650 35 L750 20 L850 50 L950 30 L1080 45 L1080 120 Z" fill="#1a2e1c" opacity="0.8"/>
      <path d="M0 120 L0 85 L150 60 L250 75 L350 40 L450 60 L580 30 L700 55 L800 40 L900 60 L1000 45 L1080 55 L1080 120 Z" fill="#0d1a10" opacity="0.9"/>
    </svg>
    <div style="position:relative;z-index:2;padding:48px 80px 0 80px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:'Playfair Display',serif;font-size:22px;letter-spacing:4px;text-transform:uppercase;color:hsl(156,8%,79%);opacity:0.85;">PS FitTrackr</span>
      <span style="font-family:'DM Mono',monospace;font-size:18px;letter-spacing:2px;color:hsl(160,5%,56%);">${sc.quarter.label.toUpperCase()}</span>
    </div>
  </div>

  <div style="padding:48px 80px 80px 80px;display:flex;flex-direction:column;justify-content:space-between;flex:1;">

  <!-- Score Hero -->
  <div style="border-radius:24px;border:1px solid rgba(255,255,255,0.06);background:hsl(150,14%,12%);padding:64px 48px;text-align:center;">
    <p style="font-family:'DM Mono',monospace;font-size:18px;letter-spacing:3px;text-transform:uppercase;color:hsl(160,5%,56%);margin:0 0 24px 0;">
      ${sc.quarter.isCurrent ? "Current Quarter" : "Final Score"}
    </p>
    <p style="font-family:'Playfair Display',serif;font-size:160px;font-weight:900;line-height:1;margin:0;color:${score >= 80 ? 'hsl(145,50%,52%)' : 'hsl(32,72%,58%)'};">
      ${score}%
    </p>
    <p style="font-family:'DM Mono',monospace;font-size:28px;color:hsl(160,5%,56%);margin:24px 0 0 0;">${scoreLabel}</p>
  </div>

  <!-- Targets + Consistency -->
  <div style="border-radius:24px;border:1px solid rgba(255,255,255,0.06);background:hsl(150,14%,12%);padding:40px;">

    <!-- Targets -->
    <div style="display:flex;flex-direction:column;gap:24px;margin-bottom:36px;">
      ${sc.targets.map(t => {
        const pct = Math.min((t.current / t.target) * 100, 100);
        const color = t.hit ? "hsl(145,50%,52%)" : "hsl(32,72%,58%)";
        const icon = t.hit
          ? `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
          : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        return `<div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${icon}
              <span style="font-size:26px;font-weight:500;">${t.label}</span>
            </div>
            <span style="font-family:'DM Mono',monospace;font-size:22px;color:hsl(160,5%,56%);">${t.current} / ${t.target} ${t.unit}</span>
          </div>
          <div style="margin-top:10px;height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;">
            <div style="height:100%;border-radius:4px;background:${color};width:${pct}%;"></div>
          </div>
        </div>`;
      }).join("")}
    </div>

    <!-- Divider -->
    <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:36px;"></div>

    <!-- Consistency -->
    <div style="display:flex;flex-direction:column;gap:24px;">
      ${sc.consistency.map(c => {
        const color = c.pct >= 80 ? "hsl(145,50%,52%)" : c.pct >= 50 ? "hsl(32,72%,58%)" : "#c85046";
        return `<div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:26px;">${c.label}</span>
            <span style="font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:${color};">${c.weeksHit}/${c.totalWeeks} wks · ${c.pct}%</span>
          </div>
          <div style="margin-top:10px;height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;">
            <div style="height:100%;border-radius:4px;background:${color};width:${c.pct}%;"></div>
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>

  <!-- Elevation Callout -->
  ${elevNote ? `
  <div style="border-radius:24px;border:1px solid rgba(255,255,255,0.06);background:hsl(150,14%,12%);padding:44px 48px;text-align:center;display:flex;align-items:center;justify-content:center;">
    <p style="font-size:32px;color:hsl(122,35%,60%);margin:0;">▲ ${elevNote}</p>
  </div>` : ""}

  <!-- Footer -->
  <div style="text-align:center;padding-top:8px;">
    <span style="font-family:'Playfair Display',serif;font-size:18px;letter-spacing:4px;text-transform:uppercase;color:hsl(156,8%,79%);opacity:0.5;">PS FitTrackr</span>
  </div>

  </div>
</div>`;
}

export async function generateShareImage(scorecard: ScorecardData): Promise<void> {
  // Create off-screen container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  // Inject the HTML
  container.innerHTML = buildShareHTML(scorecard);

  const shareCard = container.querySelector("#share-card") as HTMLElement;

  // Wait for fonts to load
  await document.fonts.ready;

  try {
    const canvas = await html2canvas(shareCard, {
      width: 1080,
      height: shareCard.scrollHeight,
      scale: 1,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const file = new File([blob], `scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        navigator.share({ files: [file], title: "My FitTrackr Scorecard" }).catch(() => downloadBlob(url, scorecard));
      } else {
        downloadBlob(url, scorecard);
      }
    }, "image/png");
  } finally {
    document.body.removeChild(container);
  }
}

function downloadBlob(url: string, scorecard: ScorecardData) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
