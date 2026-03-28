import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ScorecardData } from "@/hooks/useScorecardData";

// Sport colors (matching app palette)
const SPORT_COLORS: Record<string, [number, number, number]> = {
  Paddle: [100, 160, 210],
  Hike: [77, 179, 140],
  "XC Ski": [180, 180, 220],
  Gym: [212, 106, 90],
};

const INK: [number, number, number] = [16, 20, 18];
const PAPER: [number, number, number] = [240, 235, 225];
const MOSS: [number, number, number] = [74, 120, 76];
const MOSS_LIGHT: [number, number, number] = [100, 165, 102];
const FOG: [number, number, number] = [140, 145, 140];
const DONE: [number, number, number] = [60, 170, 100];
const AMBER: [number, number, number] = [212, 130, 58];
const CARD_BG: [number, number, number] = [28, 35, 30];
const BG: [number, number, number] = [14, 17, 15];

export function generateScorecardPdf(scorecard: ScorecardData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mx = 18; // margin x
  const cw = pw - mx * 2; // content width
  let y = 0;

  // ── Background ──
  doc.setFillColor(...BG);
  doc.rect(0, 0, pw, ph, "F");

  // ── Header band ──
  const headerH = 42;
  doc.setFillColor(26, 46, 28);
  doc.rect(0, 0, pw, headerH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOG);
  doc.text("PS FITTRACKR", mx, 12);

  doc.setFontSize(7);
  doc.text(scorecard.quarter.label.toUpperCase(), pw - mx, 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PAPER);
  doc.text("Scorecard", mx, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MOSS_LIGHT);
  doc.text("SEASON REVIEW", mx, 35);

  y = headerH + 10;

  // ── Score Card ──
  const scoreBoxH = 38;
  roundedRect(doc, mx, y, cw, scoreBoxH, 4, CARD_BG);

  // Compute score (same formula as Scorecard page)
  const targetsHit = scorecard.targets.filter(t => t.hit).length;
  const totalTargets = scorecard.targets.length;
  const targetScore = (targetsHit / Math.max(totalTargets, 1)) * 100;
  const gymCons = scorecard.consistency.find(c => c.label === "Gym Sessions");
  const independentScore = gymCons?.pct ?? 0;
  const outdoorCons = scorecard.consistency.find(c => c.label === "Outdoor Sessions");
  const kayakCons = scorecard.consistency.find(c => c.label === "Paddle Sessions");
  const hikingTargetHit = scorecard.targets.find(t => t.label.includes("Hiking"))?.hit ?? false;
  const kayakTargetHit = scorecard.targets.find(t => t.label.includes("Paddle"))?.hit ?? false;
  const outdoorPct = hikingTargetHit ? Math.max(outdoorCons?.pct ?? 0, 75) : (outdoorCons?.pct ?? 0);
  const kayakPct = kayakTargetHit ? Math.max(kayakCons?.pct ?? 0, 75) : (kayakCons?.pct ?? 0);
  const dependentScore = (outdoorPct + kayakPct) / 2;
  const milestoneScore = scorecard.totalMilestones > 0
    ? Math.min((scorecard.milestonesAchievedTotal / scorecard.totalMilestones) * 100, 100)
    : 100;
  const score = Math.round(targetScore * 0.45 + independentScore * 0.25 + dependentScore * 0.20 + milestoneScore * 0.10);

  const scoreLabel = score >= 93 ? "Outstanding" : score >= 87 ? "Excellent" : score >= 80 ? "Strong"
    : score >= 73 ? "Solid" : score >= 60 ? "Building" : "Getting Started";
  const scoreColor = score >= 80 ? DONE : AMBER;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...FOG);
  doc.text(scorecard.quarter.isCurrent ? "CURRENT QUARTER" : "FINAL SCORE", pw / 2, y + 10, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...scoreColor);
  doc.text(`${score}%`, pw / 2, y + 26, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...FOG);
  doc.text(`${scoreLabel}  ·  ${targetsHit}/${totalTargets} Targets`, pw / 2, y + 33, { align: "center" });

  y += scoreBoxH + 8;

  // ── Highlights row ──
  y = sectionHeader(doc, "HIGHLIGHTS", mx, y);
  roundedRect(doc, mx, y, cw, 28, 4, CARD_BG);

  const statW = cw / 3;
  const stats = [
    { label: "Activities", value: scorecard.totalActivities.toString() },
    { label: "Miles", value: scorecard.totalMiles.toString() },
    { label: "Elevation", value: `${scorecard.totalElevation.toLocaleString()} ft` },
  ];
  stats.forEach((s, i) => {
    const cx = mx + statW * i + statW / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...PAPER);
    doc.text(s.value, cx, y + 14, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...FOG);
    doc.text(s.label.toUpperCase(), cx, y + 21, { align: "center" });
  });

  // Sport breakdown dots
  if (scorecard.sportBreakdown.length > 0) {
    const dotsY = y + 26;
    let dx = mx + 6;
    scorecard.sportBreakdown.forEach(s => {
      const color = SPORT_COLORS[s.label] ?? [...FOG] as [number, number, number];
      doc.setFillColor(...color);
      doc.circle(dx, dotsY, 1.5, "F");
      doc.setFontSize(5.5);
      doc.setTextColor(...FOG);
      doc.text(`${s.label} ${s.count}`, dx + 3, dotsY + 0.5);
      dx += doc.getTextWidth(`${s.label} ${s.count}`) + 8;
    });
  }

  y += 34;

  // ── Targets table ──
  y = sectionHeader(doc, "TARGETS", mx, y);

  autoTable(doc, {
    startY: y,
    margin: { left: mx, right: mx },
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: PAPER,
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [40, 50, 42],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [22, 28, 24],
      textColor: FOG,
      fontSize: 6.5,
      fontStyle: "normal",
    },
    columnStyles: {
      0: { cellWidth: 45 },
      3: { cellWidth: 20, halign: "center" },
    },
    head: [["Target", "Current", "Goal", "Status"]],
    body: scorecard.targets.map(t => [
      t.label,
      `${t.current} ${t.unit}`,
      `${t.target} ${t.unit}`,
      t.hit ? "✓" : "✗",
    ]),
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const hit = scorecard.targets[data.row.index]?.hit;
        data.cell.styles.textColor = hit ? DONE : AMBER;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Consistency table ──
  y = sectionHeader(doc, "CONSISTENCY", mx, y);

  autoTable(doc, {
    startY: y,
    margin: { left: mx, right: mx },
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: PAPER,
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [40, 50, 42],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [22, 28, 24],
      textColor: FOG,
      fontSize: 6.5,
      fontStyle: "normal",
    },
    columnStyles: {
      2: { cellWidth: 22, halign: "right" },
    },
    head: [["Metric", "Weeks Hit", "Rate"]],
    body: scorecard.consistency.map(c => [
      c.label,
      `${c.weeksHit} / ${c.totalWeeks}`,
      `${c.pct}%`,
    ]),
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const pct = scorecard.consistency[data.row.index]?.pct ?? 0;
        data.cell.styles.textColor = pct >= 80 ? DONE : pct >= 50 ? AMBER : [200, 80, 70];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Review / Insights ──
  if (scorecard.insights.length > 0) {
    y = sectionHeader(doc, "REVIEW", mx, y);
    roundedRect(doc, mx, y, cw, scorecard.insights.length * 10 + 6, 4, CARD_BG);

    scorecard.insights.forEach((ins, i) => {
      const iy = y + 8 + i * 10;
      const icon = ins.type === "strength" ? "✓" : "▲";
      const iconColor = ins.type === "strength" ? DONE : AMBER;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...iconColor);
      doc.text(icon, mx + 5, iy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...PAPER);
      doc.text(ins.text, mx + 12, iy, { maxWidth: cw - 18 });
    });

    y += scorecard.insights.length * 10 + 12;
  }

  // ── Score Formula ──
  if (y + 40 < ph - 20) {
    y = sectionHeader(doc, "SCORE BREAKDOWN", mx, y);

    const rows = [
      { label: "Distance Targets", weight: 45, value: Math.round(targetScore) },
      { label: "Gym Consistency", weight: 25, value: Math.round(independentScore) },
      { label: "Outdoor / Paddle Rhythm", weight: 20, value: Math.round(dependentScore) },
      { label: "Milestones", weight: 10, value: Math.round(milestoneScore) },
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: mx, right: mx },
      theme: "plain",
      styles: {
        fillColor: CARD_BG,
        textColor: PAPER,
        fontSize: 7.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        lineColor: [40, 50, 42],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [22, 28, 24],
        textColor: FOG,
        fontSize: 6.5,
        fontStyle: "normal",
      },
      head: [["Component", "Score", "Weight", "Contribution"]],
      body: rows.map(r => [
        r.label,
        `${r.value}%`,
        `${r.weight}%`,
        `${Math.round(r.value * r.weight / 100)}`,
      ]),
      foot: [["Total", "", "", `${score}%`]],
      footStyles: {
        fillColor: [22, 28, 24],
        textColor: PAPER,
        fontStyle: "bold",
      },
    });
  }

  // ── Footer ──
  doc.setFontSize(6);
  doc.setTextColor(...FOG);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  ·  PS FitTrackr`,
    pw / 2, ph - 8, { align: "center" }
  );

  // Download
  doc.save(`scorecard-${scorecard.quarter.label.replace(/\s/g, "-").toLowerCase()}.pdf`);
}

// Helpers
function roundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: [number, number, number]) {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function sectionHeader(doc: jsPDF, label: string, x: number, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...FOG);
  doc.text(label, x, y + 3);
  return y + 7;
}
