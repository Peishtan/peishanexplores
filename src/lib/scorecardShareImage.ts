import type { ScorecardData } from "@/hooks/useScorecardData";

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

  // Grain overlay
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = W;
  grainCanvas.height = H;
  const grainCtx = grainCanvas.getContext("2d")!;
  const grainData = grainCtx.createImageData(W, H);
  for (let i = 0; i < grainData.data.length; i += 4) {
    const v = Math.random() * 255;
    grainData.data[i] = v;
    grainData.data[i + 1] = v;
    grainData.data[i + 2] = v;
    grainData.data[i + 3] = 8;
  }
  grainCtx.putImageData(grainData, 0, 0);
  ctx.drawImage(grainCanvas, 0, 0);

  const mx = 80;
  let y = 80;

  // ── Brand ──
  ctx.font = "500 26px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(156, 163, 156, 0.7)";
  ctx.letterSpacing = "6px";
  ctx.fillText("PS FITTRACKR", mx, y);
  ctx.letterSpacing = "0px";

  y += 60;

  // ── Quarter label ──
  ctx.font = "400 24px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "#6ca36e";
  ctx.fillText(scorecard.quarter.label.toUpperCase(), mx, y);

  y += 14;

  // ── Score ──
  const score = computeScore(scorecard);
  const scoreLabel = score >= 93 ? "Outstanding" : score >= 87 ? "Excellent" : score >= 80 ? "Strong"
    : score >= 73 ? "Solid" : score >= 60 ? "Building" : "Getting Started";
  const scoreColor = score >= 80 ? "#3caa64" : "#d4823a";

  ctx.font = "900 160px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = scoreColor;
  ctx.fillText(`${score}%`, mx - 6, y + 148);

  y += 168;

  ctx.font = "400 28px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.8)";
  ctx.fillText(scoreLabel, mx, y);

  y += 50;

  // ── Divider ──
  drawDivider(ctx, mx, y, W);

  y += 36;

  // ── Stats row ──
  const stats = [
    { value: scorecard.totalActivities.toString(), label: "Activities" },
    { value: scorecard.totalMiles.toString(), label: "Miles" },
    { value: `${scorecard.totalElevation.toLocaleString()}`, label: "Feet climbed" },
  ];

  const colW = (W - mx * 2) / stats.length;
  stats.forEach((s, i) => {
    const cx = mx + colW * i;
    ctx.font = "900 48px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#e8e0d4";
    ctx.fillText(s.value, cx, y);
    ctx.font = "400 20px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.6)";
    ctx.letterSpacing = "3px";
    ctx.fillText(s.label.toUpperCase(), cx, y + 30);
    ctx.letterSpacing = "0px";
  });

  y += 66;

  // ── Divider ──
  drawDivider(ctx, mx, y, W);

  y += 36;

  // ── Targets ──
  ctx.font = "400 22px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText("TARGETS", mx, y);
  ctx.letterSpacing = "0px";

  y += 10;

  scorecard.targets.forEach(t => {
    y += 42;
    const icon = t.hit ? "✓" : "✗";
    const color = t.hit ? "#3caa64" : "#d4823a";
    ctx.font = "700 28px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(icon, mx, y);
    ctx.font = "400 28px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#e8e0d4";
    ctx.fillText(t.label, mx + 40, y);
    ctx.font = "400 22px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.6)";
    ctx.fillText(`${t.current} / ${t.target} ${t.unit}`, mx + 40, y + 28);
    y += 26;
  });

  y += 36;

  // ── Consistency ──
  ctx.font = "400 22px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText("CONSISTENCY", mx, y);
  ctx.letterSpacing = "0px";

  y += 10;

  scorecard.consistency.forEach(c => {
    y += 40;
    const pctColor = c.pct >= 80 ? "#3caa64" : c.pct >= 50 ? "#d4823a" : "#c85046";
    ctx.font = "400 26px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#e8e0d4";
    ctx.fillText(c.label, mx, y);
    ctx.font = "700 26px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = pctColor;
    ctx.fillText(`${c.pct}%`, W - mx - ctx.measureText(`${c.pct}%`).width, y);
    // Bar
    const barY = y + 10;
    const barW = W - mx * 2;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundedRect(ctx, mx, barY, barW, 6, 3);
    ctx.fillStyle = pctColor;
    roundedRect(ctx, mx, barY, barW * (c.pct / 100), 6, 3);
    y += 18;
  });

  y += 36;

  // ── Elevation landmark ──
  const elevNote = getElevationNote(scorecard.totalElevation);
  if (elevNote) {
    ctx.font = "400 22px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
    ctx.letterSpacing = "4px";
    ctx.fillText("ELEVATION", mx, y);
    ctx.letterSpacing = "0px";
    y += 34;
    ctx.font = "400 24px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "#6ca36e";
    wrapText(ctx, `⛰ ${elevNote}`, mx, y, W - mx * 2, 32);
    y += 40;
  }

  // ── Highlights ──
  const hlItems = scorecard.highlights.filter(h => h.icon !== "medal");
  if (hlItems.length > 0) {
    y += 10;
    drawDivider(ctx, mx, y, W);
    y += 36;

    ctx.font = "400 22px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
    ctx.letterSpacing = "4px";
    ctx.fillText("HIGHLIGHTS", mx, y);
    ctx.letterSpacing = "0px";

    y += 10;

    const hlIcons: Record<string, string> = {
      footprints: "🥾",
      waves: "🛶",
      snowflake: "⛷",
      mountain: "⛰",
    };

    hlItems.forEach(h => {
      y += 40;
      const icon = hlIcons[h.icon] || "•";
      ctx.font = "400 26px 'DM Sans', system-ui, sans-serif";
      ctx.fillStyle = "#e8e0d4";
      ctx.fillText(`${icon}  ${h.label}`, mx, y);
      ctx.font = "700 26px 'DM Mono', monospace, system-ui";
      ctx.fillStyle = "#6ca36e";
      ctx.fillText(h.value, W - mx - ctx.measureText(h.value).width, y);
    });

    y += 30;
  }

  // ── Sport breakdown ──
  if (scorecard.sportBreakdown.length > 0 && y + 120 < H - 300) {
    y += 10;
    drawDivider(ctx, mx, y, W);
    y += 36;

    ctx.font = "400 22px 'DM Mono', monospace, system-ui";
    ctx.fillStyle = "rgba(156, 163, 156, 0.5)";
    ctx.letterSpacing = "4px";
    ctx.fillText("SPORT MIX", mx, y);
    ctx.letterSpacing = "0px";

    y += 14;

    const total = scorecard.totalActivities;
    const barStartX = mx;
    const barTotalW = W - mx * 2;
    const barH = 20;
    y += 20;

    // Stacked bar
    let bx = barStartX;
    const sportColors: Record<string, string> = {
      hiking: "#3caa64",
      kayaking: "#5aa8d0",
      xc_skiing: "#8b8cc7",
      gym: "#d46a5a",
    };
    scorecard.sportBreakdown.forEach(s => {
      const w = (s.count / total) * barTotalW;
      ctx.fillStyle = sportColors[s.type] || "#888";
      roundedRect(ctx, bx, y, Math.max(w, 4), barH, 3);
      bx += w + 3;
    });

    y += barH + 20;

    // Legend
    const legendX = mx;
    let lx = legendX;
    scorecard.sportBreakdown.forEach(s => {
      const color = sportColors[s.type] || "#888";
      ctx.fillStyle = color;
      roundedRect(ctx, lx, y - 8, 12, 12, 2);
      ctx.font = "400 20px 'DM Sans', system-ui, sans-serif";
      ctx.fillStyle = "rgba(156, 163, 156, 0.7)";
      const text = `${s.label} ${s.count}`;
      ctx.fillText(text, lx + 18, y + 3);
      lx += ctx.measureText(text).width + 44;

      if (lx > W - mx - 80) {
        lx = legendX;
        y += 28;
      }
    });

    y += 20;
  }

  // ── Mountain silhouette — positioned relative to content ──
  const mountainStartY = Math.max(y + 60, H - 300);

  ctx.fillStyle = "rgba(26, 46, 28, 0.6)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, mountainStartY);
  ctx.lineTo(100, mountainStartY - 80);
  ctx.lineTo(200, mountainStartY - 40);
  ctx.lineTo(350, mountainStartY - 150);
  ctx.lineTo(500, mountainStartY - 80);
  ctx.lineTo(600, mountainStartY - 120);
  ctx.lineTo(750, mountainStartY - 60);
  ctx.lineTo(900, mountainStartY - 110);
  ctx.lineTo(W, mountainStartY - 50);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(13, 26, 16, 0.7)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, mountainStartY + 50);
  ctx.lineTo(150, mountainStartY);
  ctx.lineTo(300, mountainStartY + 30);
  ctx.lineTo(450, mountainStartY - 30);
  ctx.lineTo(600, mountainStartY + 10);
  ctx.lineTo(750, mountainStartY - 20);
  ctx.lineTo(900, mountainStartY + 20);
  ctx.lineTo(W, mountainStartY);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // ── Footer ──
  ctx.font = "400 20px 'DM Mono', monospace, system-ui";
  ctx.fillStyle = "rgba(156, 163, 156, 0.3)";
  ctx.letterSpacing = "2px";
  const footerText = "PS FITTRACKR";
  ctx.fillText(footerText, (W - ctx.measureText(footerText).width) / 2, H - 50);
  ctx.letterSpacing = "0px";

  // ── Export ──
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);

    if (navigator.share && navigator.canShare?.({ files: [new File([blob], "scorecard.png", { type: "image/png" })] })) {
      navigator.share({
        files: [new File([blob], `scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.png`, { type: "image/png" })],
        title: "My FitTrackr Scorecard",
      }).catch(() => {
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

function drawDivider(ctx: CanvasRenderingContext2D, mx: number, y: number, W: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
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
