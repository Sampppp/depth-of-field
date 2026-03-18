/**
 * logSlider.ts
 *
 * Utilities for mapping real values to/from a normalized 0–1000 integer
 * slider range on a logarithmic scale.
 *
 * Usage:
 *   const norm = realToNorm(realValue, minReal, maxReal);  // → 0..1000
 *   const real = normToReal(normValue, minReal, maxReal);  // → minReal..maxReal
 *
 * For aperture, which follows a sqrt(2) stop sequence, we use a dedicated
 * evenly-spaced stop-based scale so that each full stop is equidistant.
 */

// ── Generic log scale ─────────────────────────────────────────────────────────

/** Map a real value to a 0–1000 normalized position on a log scale. */
export function realToNorm(real: number, min: number, max: number): number {
  const t = Math.log(real / min) / Math.log(max / min);
  return Math.round(Math.min(Math.max(t, 0), 1) * 1000);
}

/** Map a 0–1000 normalized position back to a real value on a log scale. */
export function normToReal(norm: number, min: number, max: number): number {
  const t = norm / 1000;
  return min * Math.pow(max / min, t);
}

// ── Focal length ──────────────────────────────────────────────────────────────
export const FL_MIN = 3;
export const FL_MAX = 600;

export function flToNorm(fl: number): number {
  return realToNorm(fl, FL_MIN, FL_MAX);
}
export function normToFl(norm: number): number {
  return Math.round(normToReal(norm, FL_MIN, FL_MAX));
}

// ── Aperture (f-number) — log₂ stop scale ────────────────────────────────────
// f-numbers follow a sqrt(2) sequence: each stop = ×√2.
// We map on log₂(f) so stops are evenly spaced.
export const AP_MIN = 0.7;   // faster than f/0.95 for headroom
export const AP_MAX = 22;

export function apToNorm(ap: number): number {
  // log₂ scale: position proportional to log2(ap)
  const t = (Math.log2(ap) - Math.log2(AP_MIN)) / (Math.log2(AP_MAX) - Math.log2(AP_MIN));
  return Math.round(Math.min(Math.max(t, 0), 1) * 1000);
}
export function normToAp(norm: number): number {
  const t = norm / 1000;
  const log2val = Math.log2(AP_MIN) + t * (Math.log2(AP_MAX) - Math.log2(AP_MIN));
  // Round to nearest 0.1
  return Math.round(Math.pow(2, log2val) * 10) / 10;
}

// ── Subject / camera distance (mm) ───────────────────────────────────────────
export const DIST_MIN = 200;    // 20 cm
export const DIST_MAX = 15000;  // 15 m

export function distToNorm(mm: number): number {
  return realToNorm(mm, DIST_MIN, DIST_MAX);
}
export function normToDist(norm: number): number {
  // Round to nearest 10mm
  return Math.round(normToReal(norm, DIST_MIN, DIST_MAX) / 10) * 10;
}

// ── Background distance (mm) — needs to reach 1mm ────────────────────────────
export const BG_MIN = 1;
export const BG_MAX = 50000;   // 50 m

export function bgToNorm(mm: number): number {
  return realToNorm(Math.max(mm, BG_MIN), BG_MIN, BG_MAX);
}
export function normToBg(norm: number): number {
  const raw = normToReal(norm, BG_MIN, BG_MAX);
  // Fine resolution at low end, coarser at high end
  if (raw < 10)    return Math.round(raw);
  if (raw < 100)   return Math.round(raw / 5) * 5;
  if (raw < 1000)  return Math.round(raw / 10) * 10;
  return Math.round(raw / 100) * 100;
}

// ── Framing width (mm) ────────────────────────────────────────────────────────
export const FRAME_MIN = 100;   // 10 cm
export const FRAME_MAX = 10000; // 10 m

export function frameToNorm(mm: number): number {
  return realToNorm(mm, FRAME_MIN, FRAME_MAX);
}
export function normToFrame(norm: number): number {
  const raw = normToReal(norm, FRAME_MIN, FRAME_MAX);
  if (raw < 500)  return Math.round(raw / 10) * 10;
  if (raw < 2000) return Math.round(raw / 50) * 50;
  return Math.round(raw / 100) * 100;
}