import type { WheelAnimationState, WheelTargetResult } from './types';

/**
 * Geometric helper to calculate segment rotation to align a digit at the top pointer.
 * Each ring has 10 equal segments (36 degrees each).
 */
export function calculateTargetAngle(digit: number, currentAngle: number, extraRotations: number): number {
  const segmentAngle = 360 / 10;
  // Top pointer is at -90 degrees (or 270 degrees)
  const targetSegmentCenter = digit * segmentAngle;
  // Offset to bring segment to top pointer
  const desiredBase = (360 - targetSegmentCenter) % 360;
  const currentNormalized = ((currentAngle % 360) + 360) % 360;
  let diff = desiredBase - currentNormalized;
  if (diff < 0) diff += 360;
  return currentAngle + diff + extraRotations * 360;
}

/**
 * Pure state model for the Triple Chance 3-Ring Wheel.
 * Computes angles, interpolation, and state transitions.
 */
export class WheelEngine {
  private _state: WheelAnimationState = 'idle';
  private _outerAngle = 0;
  private _middleAngle = 0;
  private _innerAngle = 0;
  private _currentResult: string | null = null;
  private _targetResult: WheelTargetResult | null = null;

  public get state(): WheelAnimationState {
    return this._state;
  }

  public get outerAngle(): number {
    return this._outerAngle;
  }

  public get middleAngle(): number {
    return this._middleAngle;
  }

  public get innerAngle(): number {
    return this._innerAngle;
  }

  public get currentResult(): string | null {
    return this._currentResult;
  }

  public setAngles(outer: number, middle: number, inner: number): void {
    this._outerAngle = outer;
    this._middleAngle = middle;
    this._innerAngle = inner;
  }

  public setState(state: WheelAnimationState): void {
    this._state = state;
  }

  public setResult(result: string | null): void {
    this._currentResult = result;
  }

  public setTargetResult(target: WheelTargetResult): {
    targetOuter: number;
    targetMiddle: number;
    targetInner: number;
  } {
    this._targetResult = target;
    this._state = 'rotating';
    this._currentResult = null;

    // Outer spins 5 extra rotations, middle 4, inner 3 for staggered deceleration
    const targetOuter = calculateTargetAngle(target.triple, this._outerAngle, 5);
    const targetMiddle = calculateTargetAngle(target.double, this._middleAngle, 4);
    const targetInner = calculateTargetAngle(target.single, this._innerAngle, 3);

    return { targetOuter, targetMiddle, targetInner };
  }

  public finalizeResult(): void {
    if (this._targetResult) {
      this._currentResult = `${this._targetResult.triple}${this._targetResult.double}${this._targetResult.single}`;
      this._state = 'final_result';
    }
  }

  public reset(): void {
    this._state = 'idle';
    this._currentResult = null;
    this._targetResult = null;
  }
}
