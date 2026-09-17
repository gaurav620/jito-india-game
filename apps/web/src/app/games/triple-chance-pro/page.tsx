'use client';

import React from 'react';

import { GameTCStage } from '@/components/game/GameTCStage';

/**
 * Triple Chance Pro Timer Game Screen
 * Migrated authentic 1360x768 legacy Unity table layout, assets, concentric wheel,
 * and responsive stage from reference pr-project-2-main.
 */
export default function TripleChanceProTimerPage() {
  return <GameTCStage code="TCPT" initialUsername="PINTU" initialBalance={62933.0} />;
}
