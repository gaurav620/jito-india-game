'use client';

import React, { useState, useEffect } from 'react';


import { ActionBar } from './ActionBar';
import { ChipTray } from './ChipTray';
import { DoubleBoard } from './DoubleBoard';
import { GameInfoModal } from './GameInfoModal';
import { ScoreboardPanel } from './ScoreboardPanel';
import { SingleBoard } from './SingleBoard';
import { TripleBoard } from './TripleBoard';
import { WheelContainer } from './WheelContainer';

import { placeBet } from '@/services/game/gameService';
import { getInitialGameState } from '@/services/game/mockGameState';
import type { GameCode, GameState } from '@/services/game/types';

export interface GameTCViewProps {
  code?: GameCode;
  onBalanceChange?: (newBalance: number) => void;
}

export const GameTCView: React.FC<GameTCViewProps> = ({
  code = 'TCT',
  onBalanceChange,
}) => {
  const [gameState, setGameState] = useState<GameState>(() => getInitialGameState(code));
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Synchronize initial code change if prop changes
  useEffect(() => {
    setGameState(getInitialGameState(code));
  }, [code]);

  // Round countdown timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.secondsLeft <= 1) {
          // Enter locked / drawing phase
          return {
            ...prev,
            secondsLeft: 0,
            phase: 'DRAWING',
            statusMessage: 'No More Play',
          };
        }
        const nextSeconds = prev.secondsLeft - 1;
        const msg = nextSeconds <= 5 ? 'No More Play' : nextSeconds <= 15 ? 'Last Chance' : 'Place your chips';
        return {
          ...prev,
          secondsLeft: nextSeconds,
          statusMessage: msg,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update parent balance whenever gameState.pointsBalance changes
  useEffect(() => {
    onBalanceChange?.(gameState.pointsBalance);
  }, [gameState.pointsBalance, onBalanceChange]);

  const isLocked = gameState.phase !== 'BETTING';
  const hasBets = Object.keys(gameState.bets).length > 0;
  const hasPreviousBets = Object.keys(gameState.previousBets).length > 0;

  // Handle placing a bet on a selection
  const handlePlaceBet = async (type: 'single' | 'double' | 'triple', value: number) => {
    if (isLocked) return;
    const key = `${type}:${value}`;
    const amount = gameState.selectedChip;

    const result = await placeBet({ type, value, amount }, gameState);
    if (!result.success) {
      if (result.error) {
        setGameState((prev) => ({ ...prev, statusMessage: result.error ?? 'Error' }));
      }
      return;
    }

    setGameState((prev) => {
      const currentStake = prev.bets[key] || 0;
      const nextBets = { ...prev.bets, [key]: currentStake + amount };
      return {
        ...prev,
        pointsBalance: result.newBalance ?? prev.pointsBalance - amount,
        playStake: result.totalPlay ?? prev.playStake + amount,
        bets: nextBets,
      };
    });
  };

  // Handle removing a bet (right-click / context menu)
  const handleRemoveBet = (type: 'single' | 'double' | 'triple', value: number) => {
    if (isLocked) return;
    const key = `${type}:${value}`;
    const currentStake = gameState.bets[key] || 0;
    if (currentStake <= 0) return;

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      delete nextBets[key];
      return {
        ...prev,
        pointsBalance: prev.pointsBalance + currentStake,
        playStake: Math.max(0, prev.playStake - currentStake),
        bets: nextBets,
      };
    });
  };

  // Quick Row selection (e.g. Row 3 places chip on all 10 row items)
  const handleQuickRow = (section: 'double' | 'triple', row: number) => {
    if (isLocked) return;
    const chip = gameState.selectedChip;
    const totalCost = chip * 10;
    if (gameState.pointsBalance < totalCost) {
      setGameState((prev) => ({ ...prev, statusMessage: 'Insufficient points balance.' }));
      return;
    }

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      const base = section === 'triple' ? prev.triplesTab * 100 : 0;
      for (let c = 0; c < 10; c++) {
        const val = base + row * 10 + c;
        const key = `${section}:${val}`;
        nextBets[key] = (nextBets[key] || 0) + chip;
      }
      return {
        ...prev,
        pointsBalance: prev.pointsBalance - totalCost,
        playStake: prev.playStake + totalCost,
        bets: nextBets,
      };
    });
  };

  // Quick Col selection (e.g. Column 5 places chip on all 10 column items)
  const handleQuickCol = (section: 'double' | 'triple', col: number) => {
    if (isLocked) return;
    const chip = gameState.selectedChip;
    const totalCost = chip * 10;
    if (gameState.pointsBalance < totalCost) {
      setGameState((prev) => ({ ...prev, statusMessage: 'Insufficient points balance.' }));
      return;
    }

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      const base = section === 'triple' ? prev.triplesTab * 100 : 0;
      for (let r = 0; r < 10; r++) {
        const val = base + r * 10 + col;
        const key = `${section}:${val}`;
        nextBets[key] = (nextBets[key] || 0) + chip;
      }
      return {
        ...prev,
        pointsBalance: prev.pointsBalance - totalCost,
        playStake: prev.playStake + totalCost,
        bets: nextBets,
      };
    });
  };

  // Random Pick (picks N random cells and stakes selected chip on them)
  const handleRandomPick = (section: 'double' | 'triple', count: number) => {
    if (isLocked) return;
    const chip = gameState.selectedChip;
    const totalCost = chip * count;
    if (gameState.pointsBalance < totalCost) {
      setGameState((prev) => ({ ...prev, statusMessage: 'Insufficient points balance.' }));
      return;
    }

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      const base = section === 'triple' ? prev.triplesTab * 100 : 0;
      const picked = new Set<number>();
      while (picked.size < Math.min(count, 100)) {
        const randIndex = Math.floor(Math.random() * 100);
        picked.add(randIndex);
      }
      picked.forEach((idx) => {
        const val = base + idx;
        const key = `${section}:${val}`;
        nextBets[key] = (nextBets[key] || 0) + chip;
      });
      return {
        ...prev,
        pointsBalance: prev.pointsBalance - totalCost,
        playStake: prev.playStake + totalCost,
        bets: nextBets,
      };
    });
  };

  // Action: DOUBLE (doubles all active bets)
  const handleDouble = () => {
    if (isLocked || !hasBets) return;
    const currentPlay = gameState.playStake;
    if (gameState.pointsBalance < currentPlay) {
      setGameState((prev) => ({ ...prev, statusMessage: 'Insufficient points to double.' }));
      return;
    }

    setGameState((prev) => {
      const nextBets: Record<string, number> = {};
      for (const [k, v] of Object.entries(prev.bets)) {
        nextBets[k] = v * 2;
      }
      return {
        ...prev,
        pointsBalance: prev.pointsBalance - currentPlay,
        playStake: prev.playStake * 2,
        bets: nextBets,
      };
    });
  };

  // Action: REPEAT (re-applies previous round bets)
  const handleRepeat = () => {
    if (isLocked || !hasPreviousBets) return;
    let prevTotal = 0;
    for (const v of Object.values(gameState.previousBets)) {
      prevTotal += v;
    }
    if (gameState.pointsBalance < prevTotal) {
      setGameState((prev) => ({ ...prev, statusMessage: 'Insufficient points to repeat.' }));
      return;
    }

    setGameState((prev) => ({
      ...prev,
      pointsBalance: prev.pointsBalance - prevTotal,
      playStake: prev.playStake + prevTotal,
      bets: { ...prev.bets, ...prev.previousBets },
    }));
  };

  // Action: CLEAR (clears all current round bets)
  const handleClear = () => {
    if (isLocked || !hasBets) return;
    setGameState((prev) => ({
      ...prev,
      pointsBalance: prev.pointsBalance + prev.playStake,
      playStake: 0,
      bets: {},
    }));
  };

  return (
    <div
      id="gametc-viewport-table"
      style={{
        position: 'absolute',
        left: '0px',
        top: '45px', // sits directly below 45px header
        width: '1360px',
        height: '723px',
        backgroundImage: "url('/assets/tc/BG.webp')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Top Panel (Height 560px) */}
      <div
        id="gametc-top-panel"
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '1360px',
          height: '560px',
        }}
      >
        {/* Left: Doubles Section (00–99 Grid) */}
        <DoubleBoard
          gameId={gameState.gameId}
          bets={gameState.bets}
          onPlaceBet={handlePlaceBet}
          onRemoveBet={handleRemoveBet}
          onQuickRow={(r) => handleQuickRow('double', r)}
          onQuickCol={(c) => handleQuickCol('double', c)}
          onRandomPick={(cnt) => handleRandomPick('double', cnt)}
          isLocked={isLocked}
        />

        {/* Center: Concentric Wheel & Countdown Timer */}
        <WheelContainer
          secondsLeft={gameState.secondsLeft}
          isSpinning={gameState.phase === 'DRAWING'}
          drawDigits={[7, 7, 2]}
          isWinState={gameState.phase === 'RESULT' || gameState.winAmount > 0}
        />

        {/* Right: Triples Section (000–999 Grid) */}
        <TripleBoard
          activeTab={gameState.triplesTab}
          onTabChange={(t) => setGameState((prev) => ({ ...prev, triplesTab: t }))}
          bets={gameState.bets}
          onPlaceBet={handlePlaceBet}
          onRemoveBet={handleRemoveBet}
          onQuickRow={(r) => handleQuickRow('triple', r)}
          onQuickCol={(c) => handleQuickCol('triple', c)}
          onRandomPick={(cnt) => handleRandomPick('triple', cnt)}
          isLocked={isLocked}
        />
      </div>

      {/* Bottom Panel (Height 165px) */}
      <div
        id="gametc-bottom-panel"
        style={{
          position: 'absolute',
          left: '0px',
          bottom: '0px',
          width: '1360px',
          height: '165px',
        }}
      >
        {/* Left: Scoreboard & Points Display */}
        <ScoreboardPanel
          recentHistory={gameState.recentHistory}
          playStake={gameState.playStake}
          winAmount={gameState.winAmount}
        />

        {/* Center Top: Singles Bar (0–9) */}
        <SingleBoard
          bets={gameState.bets}
          onPlaceBet={handlePlaceBet}
          onRemoveBet={handleRemoveBet}
          isLocked={isLocked}
        />

        {/* Center Bottom: Chip Tray & Animated Blinker Status Strip */}
        <ChipTray
          selectedChip={gameState.selectedChip}
          onSelectChip={(val) => setGameState((prev) => ({ ...prev, selectedChip: val }))}
          availableChips={gameState.availableChips}
          statusMessage={gameState.statusMessage}
        />

        {/* Right: Action Buttons (DOUBLE, REPEAT, INFO, CLEAR) */}
        <ActionBar
          hasBets={hasBets}
          hasPreviousBets={hasPreviousBets}
          isLocked={isLocked}
          onDouble={handleDouble}
          onRepeat={handleRepeat}
          onOpenInfo={() => setIsInfoOpen(true)}
          onClear={handleClear}
        />
      </div>

      {/* Info Dialog Modal Layer */}
      <GameInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        recentHistory={gameState.recentHistory}
      />
    </div>
  );
};
