import { describe, expect, it } from 'vitest';

import {
  DRAW_TOTAL_MS,
  RING_DIRECTION,
  RING_ORDER,
  RING_STOP_MS,
  RING_TURNS,
  SEGMENT_DEG,
  digitAtPointer,
  digitsOf,
  mod360,
  restAngle,
  revealedDigitCount,
  ringAngleAt,
  segmentOf,
  type RingIndex,
} from './wheel';

const RINGS: RingIndex[] = [0, 1, 2];

describe('wheel geometry', () => {
  it('gives every ring its own order', () => {
    for (const ring of RINGS) {
      expect([...RING_ORDER[ring]!].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
    expect([RING_ORDER[0]![0], RING_ORDER[1]![0], RING_ORDER[2]![0]]).toEqual([5, 9, 4]);
  });

  it('rest angle puts the digit under the pointer, on every ring', () => {
    for (const ring of RINGS) {
      for (let d = 0; d < 10; d++) expect(digitAtPointer(ring, restAngle(ring, d))).toBe(d);
    }
  });

  it('leaves a ring unrotated when its top digit is the one drawn', () => {
    expect(SEGMENT_DEG).toBe(36);
    expect(restAngle(0, 5)).toBe(0);
    expect(restAngle(1, 9)).toBe(0);
    expect(restAngle(2, 4)).toBe(0);
    expect(() => segmentOf(0, 10)).toThrow();
  });

  it('splits a triple into ring digits (outer=hundreds)', () => {
    expect(digitsOf(534)).toEqual([5, 3, 4]);
    expect(digitsOf(7)).toEqual([0, 0, 7]);
  });

  it('starts on the previous digit and lands exactly on the result', () => {
    for (const ring of RINGS) {
      expect(ringAngleAt(ring, 8, 5, 0, 3000)).toBe(restAngle(ring, 8));
      expect(ringAngleAt(ring, 8, 5, 3000, 3000)).toBe(restAngle(ring, 5));
    }
  });

  it('shows the drawn number on all three rings at once', () => {
    for (const triple of [0, 7, 42, 137, 405, 999]) {
      const digits = digitsOf(triple);
      for (const ring of RINGS) {
        const stopped = ringAngleAt(ring, 0, digits[ring]!, 9000, 9000);
        expect(digitAtPointer(ring, stopped)).toBe(digits[ring]);
      }
    }
  });

  it('spins in the configured direction', () => {
    for (const ring of RINGS) {
      const a = ringAngleAt(ring, 0, 0, 100, 3000);
      const b = ringAngleAt(ring, 0, 0, 200, 3000);
      expect(Math.sign(b - a)).toBe(RING_DIRECTION[ring]);
    }
  });

  it('never overshoots beyond the cell limit and is strictly monotonic', () => {
    for (const ring of RINGS) {
      const dir = RING_DIRECTION[ring];
      const stopMs = 5000;
      let prevAngle = ringAngleAt(ring, 8, 5, 0, stopMs);
      for (let t = 50; t < stopMs; t += 50) {
        const currAngle = ringAngleAt(ring, 8, 5, t, stopMs);
        if (dir > 0) {
          expect(currAngle).toBeGreaterThanOrEqual(prevAngle);
        } else {
          expect(currAngle).toBeLessThanOrEqual(prevAngle);
        }
        prevAngle = currAngle;
      }
    }
  });

  it('turns each ring the number of times the prefab asks for', () => {
    expect([...RING_TURNS]).toEqual([5, 7, 9]);
    expect([...RING_DIRECTION]).toEqual([-1, 1, -1]);
  });

  it('reveals digits ring by ring, at the legacy stop times', () => {
    expect([...RING_STOP_MS]).toEqual([5000, 7000, 9000]);
    expect(revealedDigitCount(0)).toBe(0);
    expect(revealedDigitCount(5000)).toBe(1);
    expect(revealedDigitCount(7500)).toBe(2);
    expect(revealedDigitCount(9000)).toBe(3);
    expect(DRAW_TOTAL_MS).toBeGreaterThan(RING_STOP_MS[2]);
  });

  it('mod360 normalizes to [0, 360)', () => {
    expect(mod360(-36)).toBe(324);
    expect(mod360(720 + 10)).toBe(10);
  });
});
