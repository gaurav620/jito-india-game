/**
 * Wheel geometry and draw timing for the Triple Chance three-ring wheel.
 *
 * Ported from the reverse-engineered reference implementation (`pr-project-2/packages/game-core
 * /src/wheel.ts`, verified frame-by-frame against the original Unity client — see
 * `pr-project-2/docs/legacy-logic.md` §2, §10, §11, §14, §16).
 *
 * Each ring carries its **own** digit order — the outer ring starts at 5, the middle at 9, the
 * inner at 4 — and the three rings do not all spin the same way (middle turns clockwise, outer
 * and inner turn counter-clockwise). Rendering all three with a single shared sequence, or
 * guessing the spin direction, puts the wrong digit under the pointer.
 */

export type RingIndex = 0 | 1 | 2;

/** Outer (hundreds), middle (tens), inner (units) — digit order clockwise from the pointer. */
export const RING_ORDER: readonly (readonly number[])[] = [
  [5, 0, 6, 4, 7, 3, 8, 2, 9, 1], // Outer / hundreds
  [9, 1, 5, 0, 6, 4, 7, 3, 8, 2], // Middle / tens
  [4, 7, 3, 8, 2, 9, 1, 5, 0, 6], // Inner / units
];

export const SEGMENT_DEG = 360 / 10;

/** Spin direction per ring: +1 clockwise, -1 counter-clockwise. Outer CCW, Mid CW, Inner CCW. */
export const RING_DIRECTION: readonly [number, number, number] = [-1, 1, -1];

/** Full turns each ring makes before settling. */
export const RING_TURNS: readonly [number, number, number] = [5, 7, 9];

/** When each ring stops, ms after the draw starts (outer=hundreds, middle=tens, inner=units). */
export const RING_STOP_MS: readonly [number, number, number] = [5000, 7000, 9000];

/** Beat left on screen after the inner ring settles before the draw phase ends. */
export const DRAW_SETTLE_MS = 500;

/** Total length of the draw animation, start to finish. */
export const DRAW_TOTAL_MS = RING_STOP_MS[2] + DRAW_SETTLE_MS;

export function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Which segment of `ring` carries `digit` (0 = the segment under the pointer at rest). */
export function segmentOf(ring: RingIndex, digit: number): number {
  const i = RING_ORDER[ring]!.indexOf(digit);
  if (i < 0) throw new RangeError(`digit out of range: ${digit}`);
  return i;
}

/**
 * Sprite rotation (deg, CSS clockwise) that puts `digit` under the top pointer.
 *
 * Segment `i` sits `i × 36°` clockwise from the top when the ring is unrotated, so bringing it
 * to the top means turning the art back by that much.
 */
export function restAngle(ring: RingIndex, digit: number): number {
  return mod360(-segmentOf(ring, digit) * SEGMENT_DEG);
}

/** Digit under the pointer for a ring rotated by `angle` degrees. */
export function digitAtPointer(ring: RingIndex, angle: number): number {
  const idx = Math.round(mod360(-angle) / SEGMENT_DEG) % 10;
  return RING_ORDER[ring]![idx]!;
}

/** Splits a 0-999 triple into its per-ring digits: [hundreds, tens, units]. */
export function digitsOf(triple: number): [number, number, number] {
  return [Math.floor(triple / 100) % 10, Math.floor(triple / 10) % 10, triple % 10];
}

/**
 * Smooth, strictly monotonic deceleration curve.
 * 
 * - Constant speed cruise phase for p in [0, t0] (first 65% of the spin).
 * - Smooth cubic deceleration for p in [t0, 1.0] (remaining 35%) with continuous C1
 *   velocity matching at t0, tapering smoothly to zero velocity at p = 1.0.
 * - Strictly monotonic (progress in [0, 1] always): guarantees the ring NEVER overshoots
 *   the cell limit or reverses direction, stopping firmly and instantly on the target number.
 */
function spinProgress(p: number, t0 = 0.65): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const D = 1.0 - t0;
  const v0 = 1.0 / (t0 + D / 3.0);
  if (p <= t0) {
    return v0 * p;
  }
  const u = (1.0 - p) / D;
  return 1.0 - (v0 * D / 3.0) * (u * u * u);
}

/**
 * Deterministic ring angle `elapsedMs` after the draw started. Because the angle is a pure
 * function of time, re-rendering mid-draw (e.g. after a re-render or a dropped frame) always
 * reproduces the exact same frame — no client-side simulation state to drift.
 */
export function ringAngleAt(
  ring: RingIndex,
  fromDigit: number,
  toDigit: number,
  elapsedMs: number,
  stopMs: number,
): number {
  const start = restAngle(ring, fromDigit);
  const end = restAngle(ring, toDigit);
  if (elapsedMs <= 0) return start;
  if (elapsedMs >= stopMs) return end;
  const dir = RING_DIRECTION[ring];
  const delta = dir > 0 ? mod360(end - start) : -mod360(start - end);
  const total = dir * RING_TURNS[ring] * 360 + delta;
  const p = elapsedMs / stopMs;
  return start + total * spinProgress(p);
}

/** How many result digits are revealed `elapsedMs` after the draw started (0-3). */
export function revealedDigitCount(
  elapsedMs: number,
  stops: readonly number[] = RING_STOP_MS,
): number {
  let n = 0;
  for (const s of stops) if (elapsedMs >= s) n++;
  return n;
}
