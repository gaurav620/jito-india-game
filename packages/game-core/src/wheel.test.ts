import { describe, it, expect } from 'vitest';

import { calculateTargetAngle, WheelEngine } from './wheel-renderer';

describe('@jito/game-core wheel logic', () => {
  it('should calculate target angle to align digit at top pointer', () => {
    // Digit 0 is at 0 deg, so to bring it to pointer (top 0 deg offset), angle is aligned
    const angle0 = calculateTargetAngle(0, 0, 1);
    expect(angle0).toBe(360);

    // Digit 5 is at 180 deg
    const angle5 = calculateTargetAngle(5, 0, 1);
    expect(angle5).toBe(180 + 360);
  });

  it('should transition WheelEngine states from idle -> rotating -> final_result', () => {
    const engine = new WheelEngine();
    expect(engine.state).toBe('idle');

    const angles = engine.setTargetResult({ triple: 7, double: 7, single: 2 });
    expect(engine.state).toBe('rotating');
    expect(angles.targetOuter).toBeGreaterThan(0);
    expect(angles.targetMiddle).toBeGreaterThan(0);
    expect(angles.targetInner).toBeGreaterThan(0);

    engine.finalizeResult();
    expect(engine.state).toBe('final_result');
    expect(engine.currentResult).toBe('772');

    engine.reset();
    expect(engine.state).toBe('idle');
    expect(engine.currentResult).toBeNull();
  });
});
