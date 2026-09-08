/**
 * Wheel animation states and target payload
 */

export type WheelAnimationState =
  | 'idle'
  | 'active'
  | 'rotating'
  | 'slowing'
  | 'result_alignment'
  | 'final_result';

export interface WheelTargetResult {
  /** Triple digit (Outer Ring: 0-9) */
  triple: number;
  /** Double digit (Middle Ring: 0-9) */
  double: number;
  /** Single digit (Inner Ring: 0-9) */
  single: number;
}

export interface WheelConfig {
  width: number;
  height: number;
  outerRadius: number;
  middleRadius: number;
  innerRadius: number;
  centerRadius: number;
}

export interface WheelStateUpdateListener {
  (state: WheelAnimationState, currentDisplay?: string): void;
}
