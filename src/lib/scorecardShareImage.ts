import type { ScorecardData } from "@/hooks/useScorecardData";

// ── Design tokens (from index.css HSL values, converted to hex) ──
const COLORS = {
  background: "#0c140e",       // hsl(150, 8%, 5%)
  card: "#1a2e1c",             // hsl(150, 14%, 12%)
  foreground: "#ede4d7",       // hsl(35, 30%, 93%) — paper
  fog: "#868e88",              // hsl(160, 5%, 56%)
  fogDim: "rgba(134,142,136,0.5)",
  fogFaint: "rgba(134,142,136,0.3)",
  moss: "#487a3d",             // hsl(122, 25%, 38%)
  mossLight: "#6ab85a",        // hsl(122, 35%, 60%)
  done: "#42c478",             // hsl(145, 50%, 52%)
  amber: "#d4923a",            // hsl(32, 72%, 58%)
  coral: "#d46a5a",            // gym color from memory
  destructive: "#c85046",
  border: "rgba(255,255,255,0.06)",
  kayak: "#5aa8d0",            // hsl(200, 60%, 55%)
  xcSki: "#8b8cc7",            // hsl(240, 30%, 72%)
};

// ── Fonts (matching Google Fonts loaded in index.html) ──
const FONT = {
  display: (w: number, s: number) => `${w} ${s}px 'Playfair Display', serif`,
  body: (w: number, s: number) => `${w} ${s}px 'DM Sans', system-ui, sans-serif`,
  mono: (w: number, s: number) => `${w} ${s}px 'DM Mono', monospace, system-ui`,
};

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
  if (next.length > 0) return `${totalElev.toLocaleString()} ft — ${gap(next[0].ft, totalElev)} ft to ${next[0].name}`;
  return null;
}

function gap(a: number, b: number) { return (a - b).toLocaleString(); }

function computeScore(sc: ScorecardData): number {
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
    ? Math.min((sc.milestonesAchievedTotal / sc.totalMilestones) * 100, 100) : 100;
  return Math.round(targetScore * 0.45 + gymPct * 0.25 + depScore * 0.20 + milestoneScore * 0.10);
}

// ── Drawing helpers ──

function drawCircleIcon(ctx: CanvasRenderingContext2D, x: number, cy: number, r: number, color: string, type: "check" | "x") {
  // Filled circle
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(x + r, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Icon stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (type === "check") {
    ctx.beginPath();
    ctx.moveTo(x + r - 5, cy);
    ctx.lineTo(x + r - 1, cy + 4);
    ctx.lineTo(x + r + 6, cy - 5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r - 4, cy - 4);
    ctx.lineTo(x + r + 4, cy + 4);
    ctx.moveTo(x + r + 4, cy - 4);
    ctx.lineTo(x + r - 4, cy + 4);
    ctx.stroke();
  }
}

function drawSectionLabel(ctx: CanvasRenderingContext2D, label: string, mx: number, y: number) {
  ctx.font = FONT.mono(400, 20);
  ctx.fillStyle = COLORS.fogDim;
  ctx.letterSpacing = "4px";
  ctx.fillText(label, mx, y);
  ctx.letterSpacing = "0px";
}

function drawDivider(ctx: CanvasRenderingContext2D, mx: number, y: number, W: number) {
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, y);
  ctx.lineTo(W - mx, y);
  ctx.stroke();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "", cy = y;
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW && line !== "") {
      ctx.fillText(line.trim(), x, cy);
      line = w + " ";
      cy += lh;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, cy);
}

// ── Main export ──

export async function generateShareImage(scorecard: ScorecardData): Promise<void> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient (matches app bg) ──
  const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bg.addColorStop(0, "#162118");
  bg.addColorStop(0.5, COLORS.background);
  bg.addColorStop(1, "#0a100c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grain overlay
  const gc = document.createElement("canvas");
  gc.width = W; gc.height = H;
  const gctx = gc.getContext("2d")!;
  const gd = gctx.createImageData(W, H);
  for (let i = 0; i < gd.data.length; i += 4) {
    const v = Math.random() * 255;
    gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v;
    gd.data[i + 3] = 8;
  }
  gctx.putImageData(gd, 0, 0);
  ctx.drawImage(gc, 0, 0);

  const mx = 80;
  let y = 76;

  // ── Brand ──
  ctx.font = FONT.mono(400, 22);
  ctx.fillStyle = COLORS.fogFaint;
  ctx.letterSpacing = "6px";
  ctx.fillText("PS FITTRACKR", mx, y);
  ctx.letterSpacing = "0px";

  y += 56;

  // ── Quarter ──
  ctx.font = FONT.mono(400, 22);
  ctx.fillStyle = COLORS.mossLight;
  ctx.fillText(scorecard.quarter.label.toUpperCase(), mx, y);

  y += 12;

  // ── Score (Playfair Display — matches app's font-display) ──
  const score = computeScore(scorecard);
  const scoreLabel = score >= 93 ? "Outstanding" : score >= 87 ? "Excellent" : score >= 80 ? "Strong"
    : score >= 73 ? "Solid" : score >= 60 ? "Building" : "Getting Started";
  const scoreColor = score >= 80 ? COLORS.done : COLORS.amber;

  ctx.font = FONT.display(900, 154);
  ctx.fillStyle = scoreColor;
  ctx.fillText(`${score}%`, mx - 4, y + 142);
  y += 154;

  ctx.font = FONT.mono(400, 24);
  ctx.fillStyle = COLORS.fog;
  ctx.fillText(scoreLabel, mx, y);

  y += 46;
  drawDivider(ctx, mx, y, W);
  y += 34;

  // ── Stats row ──
  const stats = [
    { value: scorecard.totalActivities.toString(), label: "Activities" },
    { value: scorecard.totalMiles.toString(), label: "Miles" },
    { value: scorecard.totalElevation.toLocaleString(), label: "Feet climbed" },
  ];
  const colW = (W - mx * 2) / stats.length;
  stats.forEach((s, i) => {
    const cx = mx + colW * i;
    ctx.font = FONT.display(700, 44);
    ctx.fillStyle = COLORS.foreground;
    ctx.fillText(s.value, cx, y);
    ctx.font = FONT.mono(400, 18);
    ctx.fillStyle = COLORS.fogDim;
    ctx.letterSpacing = "3px";
    ctx.fillText(s.label.toUpperCase(), cx, y + 28);
    ctx.letterSpacing = "0px";
  });

  y += 60;
  drawDivider(ctx, mx, y, W);
  y += 34;

  // ── Targets ──
  drawSectionLabel(ctx, "TARGETS", mx, y);
  y += 8;

  scorecard.targets.forEach(t => {
    y += 40;
    const color = t.hit ? COLORS.done : COLORS.amber;
    drawCircleIcon(ctx, mx, y - 5, 12, color, t.hit ? "check" : "x");
    ctx.font = FONT.body(500, 26);
    ctx.fillStyle = COLORS.foreground;
    ctx.fillText(t.label, mx + 34, y);
    ctx.font = FONT.mono(400, 20);
    ctx.fillStyle = COLORS.fog;
    ctx.fillText(`${t.current} / ${t.target} ${t.unit}`, mx + 34, y + 26);
    y += 24;
  });

  y += 32;

  // ── Consistency ──
  drawSectionLabel(ctx, "CONSISTENCY", mx, y);
  y += 8;

  scorecard.consistency.forEach(c => {
    y += 38;
    const pctColor = c.pct >= 80 ? COLORS.done : c.pct >= 50 ? COLORS.amber : COLORS.destructive;
    ctx.font = FONT.body(400, 24);
    ctx.fillStyle = COLORS.foreground;
    ctx.fillText(c.label, mx, y);

    const pctStr = `${c.weeksHit}/${c.totalWeeks} wks · ${c.pct}%`;
    ctx.font = FONT.mono(500, 20);
    ctx.fillStyle = pctColor;
    ctx.fillText(pctStr, W - mx - ctx.measureText(pctStr).width, y);

    // Bar
    const barY = y + 10;
    const barW = W - mx * 2;
    ctx.fillStyle = COLORS.border;
    roundedRect(ctx, mx, barY, barW, 5, 2.5);
    ctx.fillStyle = pctColor;
    roundedRect(ctx, mx, barY, barW * (c.pct / 100), 5, 2.5);
    y += 18;
  });

  y += 32;

  // ── Elevation landmark ──
  const elevNote = getElevationNote(scorecard.totalElevation);
  if (elevNote) {
    drawSectionLabel(ctx, "ELEVATION", mx, y);
    y += 30;
    ctx.font = FONT.body(400, 22);
    ctx.fillStyle = COLORS.mossLight;
    wrapText(ctx, `▲ ${elevNote}`, mx, y, W - mx * 2, 30);
    y += 36;
  }

  // ── Highlights ──
  const hlItems = scorecard.highlights.filter(h => h.icon !== "medal");
  if (hlItems.length > 0) {
    y += 6;
    drawDivider(ctx, mx, y, W);
    y += 34;
    drawSectionLabel(ctx, "HIGHLIGHTS", mx, y);
    y += 8;

    hlItems.forEach(h => {
      y += 36;
      ctx.font = FONT.body(400, 24);
      ctx.fillStyle = COLORS.fog;
      ctx.fillText(h.label, mx, y);
      ctx.font = FONT.mono(500, 24);
      ctx.fillStyle = COLORS.mossLight;
      ctx.fillText(h.value, W - mx - ctx.measureText(h.value).width, y);
    });
    y += 24;
  }

  // ── Sport Mix ──
  const sportColors: Record<string, string> = {
    hiking: COLORS.done,
    kayaking: COLORS.kayak,
    xc_skiing: COLORS.xcSki,
    gym: COLORS.coral,
  };

  if (scorecard.sportBreakdown.length > 0 && y + 100 < H - 280) {
    y += 6;
    drawDivider(ctx, mx, y, W);
    y += 34;
    drawSectionLabel(ctx, "SPORT MIX", mx, y);
    y += 24;

    const total = scorecard.totalActivities;
    const barW = W - mx * 2;
    let bx = mx;

    scorecard.sportBreakdown.forEach((s, i) => {
      const w = (s.count / total) * barW - (i < scorecard.sportBreakdown.length - 1 ? 3 : 0);
      ctx.fillStyle = sportColors[s.type] || COLORS.fog;
      roundedRect(ctx, bx, y, Math.max(w, 4), 16, 3);
      bx += w + 3;
    });

    y += 34;

    // Legend
    let lx = mx;
    scorecard.sportBreakdown.forEach(s => {
      const color = sportColors[s.type] || COLORS.fog;
      ctx.fillStyle = color;
      roundedRect(ctx, lx, y - 7, 10, 10, 2);
      ctx.font = FONT.mono(400, 18);
      ctx.fillStyle = COLORS.fog;
      const text = `${s.label} ${s.count}`;
      ctx.fillText(text, lx + 16, y + 2);
      lx += ctx.measureText(text).width + 38;
      if (lx > W - mx - 60) { lx = mx; y += 24; }
    });
    y += 20;
  }

  // ── Mountain silhouettes ──
  const mtnTop = Math.max(y + 50, H - 260);

  ctx.fillStyle = "rgba(22, 33, 24, 0.6)";
  ctx.beginPath();
  ctx.moveTo(0, H); ctx.lineTo(0, mtnTop);
  ctx.lineTo(100, mtnTop - 70); ctx.lineTo(200, mtnTop - 30);
  ctx.lineTo(350, mtnTop - 130); ctx.lineTo(500, mtnTop - 70);
  ctx.lineTo(600, mtnTop - 100); ctx.lineTo(750, mtnTop - 50);
  ctx.lineTo(900, mtnTop - 90); ctx.lineTo(W, mtnTop - 40);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  ctx.fillStyle = "rgba(12, 20, 14, 0.7)";
  ctx.beginPath();
  ctx.moveTo(0, H); ctx.lineTo(0, mtnTop + 40);
  ctx.lineTo(150, mtnTop - 10); ctx.lineTo(300, mtnTop + 20);
  ctx.lineTo(450, mtnTop - 20); ctx.lineTo(600, mtnTop + 10);
  ctx.lineTo(750, mtnTop - 15); ctx.lineTo(900, mtnTop + 15);
  ctx.lineTo(W, mtnTop); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  // ── Footer ──
  ctx.font = FONT.mono(400, 18);
  ctx.fillStyle = COLORS.fogFaint;
  ctx.letterSpacing = "3px";
  const ft = "PS FITTRACKR";
  ctx.fillText(ft, (W - ctx.measureText(ft).width) / 2, H - 46);
  ctx.letterSpacing = "0px";

  // ── Export ──
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
}

function downloadBlob(url: string, scorecard: ScorecardData) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
