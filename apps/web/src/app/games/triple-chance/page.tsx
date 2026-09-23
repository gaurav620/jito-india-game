'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

import { GameTCStage } from '@/components/game/GameTCStage';

function TripleChanceContent() {
  const searchParams = useSearchParams();
  const stateParam = searchParams.get('state')?.toLowerCase();
  const isWin = stateParam === 'win';

  return (
    <GameTCStage
      code="TCT"
      initialUsername="PINTU"
      initialBalance={isWin ? 167193.0 : 167249.0}
      initialState={isWin ? 'win' : 'betting'}
    />
  );
}

/**
 * Triple Chance Timer Game Screen
 * Migrated authentic 1360x768 legacy Unity table layout, assets, concentric wheel,
 * and responsive stage from reference pr-project-2-main.
 */
export default function TripleChanceTimerPage() {
  return (
    <Suspense fallback={null}>
      <TripleChanceContent />
    </Suspense>
  );
}
