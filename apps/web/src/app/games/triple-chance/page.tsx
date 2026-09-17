'use client';

import React from 'react';

import { GameTCStage } from '@/components/game/GameTCStage';

/**
 * Triple Chance Timer Game Screen
 * Migrated authentic 1360x768 legacy Unity table layout, assets, concentric wheel,
 * and responsive stage from reference pr-project-2-main.
 */
export default function TripleChanceTimerPage() {
  return <GameTCStage code="TCT" initialUsername="PINTU" initialBalance={62933.0} />;
}
