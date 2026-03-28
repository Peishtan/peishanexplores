import type { ScorecardData } from "@/hooks/useScorecardData";

// Elevation landmarks (same as in useScorecardData)
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
  if (passed.length > 0) {
    return `${totalElev.toLocaleString()} ft climbed — past ${passed[0].name}`;
  }
  const next = LANDMARKS.filter(l => totalElev < l.ft).sort((a, b) => a.ft - b.ft);
  if (next.length > 0) {
    const gap = next[0].ft - totalElev;
    return `${totalElev.toLocaleString()} ft — ${gap.toLocaleString()} ft to ${next[0].name}`;
  }
  return null;
}

function computeScore(scorecard: ScorecardData): number {
  const targetsHit = scorecard.targets.filter(t => t.hit).length;
  const totalTargets = scorecard.targets.length;
  const targetScore = (targetsHit / Math.max(totalTargets, 1)) * 100;
  const gymCons = scorecard.consistency.find(c => c.label === "Gym Sessions");
  const independentScore = gymCons?.pct ?? 0;
  const outdoorCons = scorecard.consistency.find(c => c.label === "Outdoor Sessions");
  const kayakCons = scorecard.consistency.find(c => c.label === "Paddle Sessions");
  const hikingHit = scorecard.targets.find(t => t.label.includes("Hiking"))?.hit ?? false;
  const kayakHit = scorecard.targets.find(t => t.label.includes("Paddle"))?.hit ?? false;
  const outdoorPct = hikingHit ? Math.max(outdoorCons?.pct ?? 0, 75) : (outdoorCons?.pct ?? 0);
  const kayakPct = kayakHit ? Math.max(kayakCons?.pct ?? 0, 75) : (kayakCons?.pct ?? 0);
  const dependentScore = (outdoorPct + kayakPct) / 2;
  const milestoneScore = scorecard.totalMilestones > 0
    ? Math.min((scorecard.milestonesAchievedTotal / scorecard.totalMilestones) * 100, 100)
    : 100;
  return Math.round(targetScore * 0.45 + independentScore * 0.25 + dependentScore * 0.20 + milestoneScore * 0.10);
}

export async function generateShareImage(scorecard: ScorecardData): Promise<void> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bgGrad.addColorStop(0, "#1a2e1c");
  bgGrad.addColorStop(0.4, "#0d1a10");
  bgGrad.addColorStop(1, "#0a1215");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Grain overlay (subtle noise)
  const grainData = ctx.createImageData(W, H);
  for (let i = 0; i < grainData.data.length; i += 4) {
    const v = Math.random() * 255;
    grainData.data[i] = v;
    grainData.data[i + 1] = v;
    grainData.data[i + 2] = v;
    grainData.data[i + 3] = 8;
  }
  ctx.putImageData(grainData, 0, 0);

  // Mountain silhouette at bottom
  ctx.fillStyle = "rgba(26, 46, 28, 0.6)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 200);
  ctx.lineTo(100, H - 280);
  ctx.lineTo(200, H - 240);
  ctx.lineTo(350, H - 350);
  ctx.lineTo(500, H - 280);
  ctx.lineTo(600, H - 320);
  ctx.lineTo(750, H - 260);
  ctx.lineTo(900, H - 310);
  ctx.lineTo(W, H - 250);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(13, 26, 16, 0.7)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 150);
  ctx.lineTo(150, H - 200);
  ctx.lineTo(300, H - 170);
  ctx.lineTo(450, H - 230);
  ctx.lineTo(600, H - 190);
  ctx.lineTo(750, H - 220);
  ctx.lineTo(900, H - 180);
  ctx.lineTo(W, H - 200);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  const mx = 80;
  let y = 100;

  // ── Brand ──
  ctx.font = "500 28px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(156, 163, 156, 0.7)";
  ctx.letterSpacing = "6px";
  ctx.fillText("PS FITTRACKR", mx, y);
  ctx.letterSpacing = "0px";

  y += 80;

  // ── Quarter label ──
  ctx.font = "400 26px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "#6ca36e";
  ctx.fillText(scorecard.quarter.label.toUpperCase(), mx, y);

  y += 20;

  // ── Score ──
  const score = computeScore(scorecard);
  const scoreLabel = score >= 93 ? "Outstanding" : score >= 87 ? "Excellent" : score >= 80 ? "Strong"
    : score >= 73 ? "Solid" : score >= 60 ? "Building" : "Getting Started";
  const scoreColor = score >= 80 ? "#3caa64" : "#d4823a";

  ctx.font = "900 180px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = scoreColor;
  ctx.fillText(`${score}%`, mx - 6, y + 165);

  y += 195;

  ctx.font = "400 32px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.8)";
  ctx.fillText(scoreLabel, mx, y);

  y += 70;

  // ── Divider ──
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, y);
  ctx.lineTo(W - mx, y);
  ctx.stroke();

  y += 50;

  // ── Stats row ──
  const stats = [
    { value: scorecard.totalActivities.toString(), label: "Activities" },
    { value: scorecard.totalMiles.toString(), label: "Miles" },
    { value: `${scorecard.totalElevation.toLocaleString()}`, label: "Feet climbed" },
  ];

  const colW = (W - mx * 2) / stats.length;
  stats.forEach((s, i) => {
    const cx = mx + colW * i;
    ctx.font = "900 52px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#e8e0d4";
    ctx.fillText(s.value, cx, y);
    ctx.font = "400 22px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.6)";
    ctx.letterSpacing = "3px";
    ctx.fillText(s.label.toUpperCase(), cx, y + 34);
    ctx.letterSpacing = "0px";
  });

  y += 80;

  // ── Targets ──
  const targetsHit = scorecard.targets.filter(t => t.hit).length;
  ctx.font = "400 24px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText("TARGETS", mx, y);
  ctx.letterSpacing = "0px";

  y += 16;

  scorecard.targets.forEach(t => {
    y += 50;
    const icon = t.hit ? "✓" : "✗";
    const color = t.hit ? "#3caa64" : "#d4823a";
    ctx.font = "700 30px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(icon, mx, y);
    ctx.font = "400 30px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#e8e0d4";
    ctx.fillText(t.label, mx + 44, y);
    ctx.font = "400 26px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.6)";
    ctx.fillText(`${t.current} / ${t.target} ${t.unit}`, mx + 44, y + 34);
  });

  y += 70;

  // ── Consistency ──
  ctx.font = "400 24px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText("CONSISTENCY", mx, y);
  ctx.letterSpacing = "0px";

  y += 16;

  scorecard.consistency.forEach(c => {
    y += 50;
    const pctColor = c.pct >= 80 ? "#3caa64" : c.pct >= 50 ? "#d4823a" : "#c85046";
    ctx.font = "400 28px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#e8e0d4";
    ctx.fillText(c.label, mx, y);
    ctx.font = "700 28px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = pctColor;
    ctx.fillText(`${c.pct}%`, W - mx - ctx.measureText(`${c.pct}%`).width, y);
    // Bar
    const barY = y + 12;
    const barW = W - mx * 2;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundedRectCanvas(ctx, mx, barY, barW, 6, 3);
    ctx.fillStyle = pctColor;
    roundedRectCanvas(ctx, mx, barY, barW * (c.pct / 100), 6, 3);
    y += 22;
  });

  y += 50;

  // ── Elevation landmark ──
  const elevNote = getElevationNote(scorecard.totalElevation);
  if (elevNote && y + 60 < H - 120) {
    ctx.font = "400 24px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
    ctx.letterSpacing = "4px";
    ctx.fillText("ELEVATION", mx, y);
    ctx.letterSpacing = "0px";
    y += 40;
    ctx.font = "400 26px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#6ca36e";
    wrapText(ctx, `⛰ ${elevNote}`, mx, y, W - mx * 2, 36);
  }

  // ── Footer ──
  ctx.font = "400 20px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.3)";
  ctx.letterSpacing = "2px";
  const footerText = "PS FITTRACKR";
  ctx.fillText(footerText, (W - ctx.measureText(footerText).width) / 2, H - 60);
  ctx.letterSpacing = "0px";

  // ── Export ──
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);

    // Try native share first
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], "scorecard.png", { type: "image/png" })] })) {
      navigator.share({
        files: [new File([blob], `scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.png`, { type: "image/png" })],
        title: "My FitTrackr Scorecard",
      }).catch(() => {
        // Fallback to download
        downloadBlob(url, scorecard);
      });
    } else {
      downloadBlob(url, scorecard);
    }
  }, "image/png");
}

function downloadBlob(url: string, scorecard: ScorecardData) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

function roundedRectCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, cy);
      line = word + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}
