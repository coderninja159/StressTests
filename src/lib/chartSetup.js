import { Chart, registerables } from "chart.js";

/** Grafiklar uchun palitra (admin / psixolog dashboard) */
export const COLORS = {
  primary: "#6366F1",
  teal: "#14B8A6",
  amber: "#F59E0B",
  rose: "#F43F5E",
  emerald: "#10B981",
  violet: "#8B5CF6",
  muted: "#94A3B8",
};

export function hexToRgba(hex, alpha) {
  const h = String(hex).replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Vertikal gradient (line/area fill uchun)
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('chart.js').ChartArea} chartArea
 * @param {string} color — #RRGGBB
 * @param {number} topAlpha
 */
export function createGradient(ctx, chartArea, color, topAlpha = 0.2) {
  if (!chartArea) return hexToRgba(color, topAlpha);
  const { top, bottom } = chartArea;
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, hexToRgba(color, topAlpha));
  gradient.addColorStop(1, hexToRgba(color, 0));
  return gradient;
}

/** Gorizontal bar uchun (primary → primary-light) */
export function createHorizontalBarGradient(ctx, chartArea, c0 = COLORS.primary, c1 = COLORS.violet) {
  if (!chartArea) return c0;
  const { left, right } = chartArea;
  const g = ctx.createLinearGradient(left, 0, right, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

Chart.defaults.font.family = "'DM Sans', 'Outfit', system-ui, sans-serif";
Chart.defaults.color = "#64748B";
Chart.defaults.borderColor = "#F1F5F9";

Chart.register(...registerables);
