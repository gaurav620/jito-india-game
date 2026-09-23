'use client';

import React, { useState, useEffect, useRef } from 'react';

import { DRAW_TOTAL_MS, digitsOf, revealedDigitCount } from '@jito/game-core';

import { ActionBar } from './ActionBar';
import { ChipTray } from './ChipTray';
import { DoubleBoard } from './DoubleBoard';
import { GameInfoModal } from './GameInfoModal';
import { ScoreboardPanel } from './ScoreboardPanel';
import { SingleBoard } from './SingleBoard';
import { TripleBoard } from './TripleBoard';
import { WheelContainer } from './WheelContainer';
import { WinVideoOverlay } from './WinVideoOverlay';

import { useGameAudio } from '@/hooks/useGameAudio';
import { getInitialGameState, getWinGameState } from '@/services/game/mockGameState';
import type { BetType, DrawResult, GameCode, GamePhase, GameState } from '@/services/game/types';

/** Win = stake × multiplier. Mirrors the reference table's placeholder payout rules. */
const PAYOUT: Record<BetType, number> = { single: 9, double: 90, triple: 900 };

/** Sums up every bet that matches the drawn result, for the win dialog and the board highlights. */
function settleBets(bets: Record<string, number>, result: DrawResult): number {
  let winAmount = 0;
  for (const [key, stake] of Object.entries(bets)) {
    const [type, valueStr] = key.split(':') as [BetType, string];
    const value = Number(valueStr);
    const target = type === 'single' ? result.single : type === 'double' ? result.double : result.triple;
    if (value === target) winAmount += stake * PAYOUT[type];
  }
  return winAmount;
}

export interface GameTCViewProps {
  code?: GameCode;
  initialState?: 'betting' | 'win';
  onBalanceChange?: (newBalance: number) => void;
  onToggleMode?: () => void;
}

export const GameTCView: React.FC<GameTCViewProps> = ({
  code = 'TCT',
  initialState = 'betting',
  onBalanceChange,
  onToggleMode,
}) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialState === 'win') {
      return getWinGameState(code);
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('state')?.toLowerCase() === 'win') {
        return getWinGameState(code);
      }
    }
    return getInitialGameState(code);
  });
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const audio = useGameAudio();
  const [activeTooltip, setActiveTooltip] = useState<{
    type: 'double' | 'triple' | 'single';
    value: number;
  } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the previous phase to detect transitions (null on mount so initial BETTING phase triggers place_your_bets)
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const prevSecondsRef = useRef(gameState.secondsLeft);
  const noMoreBetsPlayedRef = useRef(false);

  // Digits each ring is currently resting on (outer/mid/inner) — the wheel's idle position and
  // the starting point ("fromDigit") the next draw spins away from. Matches the top digit of
  // each ring's sprite (Wheel_1/2/3.webp) until the first draw completes.
  const [wheelDigits, setWheelDigits] = useState<[number, number, number]>([5, 9, 4]);
  // Digits this round's draw is spinning toward, set the instant the DRAWING phase starts.
  const [drawTarget, setDrawTarget] = useState<[number, number, number] | null>(null);
  const [drawStartTs, setDrawStartTs] = useState<number | null>(null);
  // 0-3 result digits revealed so far in the jewelled window, one per ring stop (5 s/7 s/9 s).
  const [revealed, setRevealed] = useState(0);
  // Win video overlay: shown when winAmount ≥ 1000 in RESULT phase
  const [showWinVideo, setShowWinVideo] = useState(false);
  const handleWinVideoEnd = () => setShowWinVideo(false);

  // Turn off win video when next draw begins
  useEffect(() => {
    if (gameState.phase === 'DRAWING') {
      setShowWinVideo(false);
    }
  }, [gameState.phase]);

  // Effects below read audio via this ref instead of the dependency array so the DRAWING-phase
  // polling loop (which must run exactly once per draw) doesn't restart every time the audio
  // hook's returned object identity changes on re-render.
  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);

  // Clear tooltip when phase changes away from BETTING
  useEffect(() => {
    if (gameState.phase !== 'BETTING') {
      setActiveTooltip(null);
    }
  }, [gameState.phase]);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  // Sync pointsBalance to parent stage
  useEffect(() => {
    onBalanceChange?.(gameState.pointsBalance);
  }, [gameState.pointsBalance, onBalanceChange]);

  // Keep synced if parent changes initialState
  useEffect(() => {
    if (initialState === 'win') {
      setGameState(getWinGameState(code));
    } else if (initialState === 'betting') {
      setGameState(getInitialGameState(code));
    }
  }, [initialState, code]);

  // Check URL state param on mount and listen to popstate
  useEffect(() => {
    const checkState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('state')?.toLowerCase() === 'win') {
          setGameState(getWinGameState(code));
        } else if (params.get('state')?.toLowerCase() === 'betting') {
          setGameState(getInitialGameState(code));
        }
      }
    };
    checkState();
    window.addEventListener('popstate', checkState);
    return () => window.removeEventListener('popstate', checkState);
  }, [code]);

  // Hotkey support: 'W' for Win State, 'B' for Active Betting State
  // DEV ONLY: 'V' triggers the big-win video overlay (simulates a 1000+ win)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key?.toLowerCase() === 'w' || e.code === 'KeyW') {
        setGameState(getWinGameState(code));
      } else if (e.key?.toLowerCase() === 'b' || e.code === 'KeyB') {
        prevPhaseRef.current = null;
        setGameState(getInitialGameState(code));
      } else if (e.key?.toLowerCase() === 'v' || e.code === 'KeyV') {
        // DEV: force-show win video — remove this branch before production build
        setShowWinVideo((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code]);

  const toggleMockState = () => {
    if (onToggleMode) {
      onToggleMode();
    } else {
      setGameState((prev) => (prev.phase === 'RESULT' ? getInitialGameState(code) : getWinGameState(code)));
    }
  };

  // Betting Countdown Loop — only runs during BETTING; hitting 0 hands off to the draw effect.
  useEffect(() => {
    if (gameState.phase !== 'BETTING') return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.phase !== 'BETTING') return prev;
        if (prev.secondsLeft > 1) {
          const nextSeconds = prev.secondsLeft - 1;
          let nextStatus = prev.statusMessage;
          if (nextSeconds <= 5) {
            nextStatus = 'No More Play';
          } else if (nextSeconds <= 15 && prev.statusMessage === 'Place your chips') {
            nextStatus = 'LAST CHANCE';
          }
          return {
            ...prev,
            secondsLeft: nextSeconds,
            statusMessage: nextStatus,
          };
        }
        // secondsLeft was 1 → betting closes, the draw starts
        return {
          ...prev,
          secondsLeft: 0,
          phase: 'DRAWING',
          statusMessage: 'No More Play',
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.phase]);

  // Betting re-opening (naturally, via the win-preview hotkey, or the URL `?state=betting`
  // param) must drop the previous round's jewelled reveal — otherwise the window and the
  // centre-orb digits from the last draw stay on screen while chips are being placed again.
  useEffect(() => {
    if (gameState.phase === 'BETTING') setRevealed(0);
  }, [gameState.phase]);

  // Draw lifecycle: generates this round's result, spins the wheel on a deterministic clock,
  // and fires a ring-stop chime + reveal at 5 s / 7 s / 9 s (legacy-logic.md §2, §16). The wheel
  // keeps spinning (wheel_spinning loop) until the inner ring settles at 9 s, then the phase
  // moves to RESULT once the result has been on screen for a short beat (DRAW_TOTAL_MS).
  useEffect(() => {
    if (gameState.phase !== 'DRAWING') return;

    const triple = Math.floor(Math.random() * 1000);
    const result: DrawResult = { triple, double: triple % 100, single: triple % 10 };
    const targetDigits = digitsOf(triple);
    const startTs = Date.now();

    setDrawTarget(targetDigits);
    setDrawStartTs(startTs);
    setRevealed(0);
    setGameState((prev) => ({ ...prev, drawResult: result }));

    let firedCount = 0;
    const poll = setInterval(() => {
      const elapsed = Date.now() - startTs;
      const count = revealedDigitCount(elapsed);
      if (count > firedCount) {
        for (let i = firedCount; i < count; i++) audioRef.current.play('wheel_point_chime');
        firedCount = count;
        setRevealed(count);
        if (count >= 3) audioRef.current.stop('wheel_spinning');
      }

      if (elapsed >= DRAW_TOTAL_MS) {
        clearInterval(poll);
        setWheelDigits(targetDigits);
        setGameState((prev) => {
          if (prev.phase !== 'DRAWING') return prev;
          const winAmount = settleBets(prev.bets, result);
          // Trigger big-win video if winAmount >= 1000
          if (winAmount >= 1000) setShowWinVideo(true);
          return {
            ...prev,
            phase: 'RESULT',
            winAmount,
            pointsBalance: prev.pointsBalance + winAmount,
            statusMessage: winAmount > 0 ? 'YOU WIN' : 'Better luck next time',
          };
        });
      }
    }, 100);

    return () => clearInterval(poll);
  }, [gameState.phase]);

  // Result stays on screen for a beat (mirrors the legacy "You Have Won" plate's 4 s auto-hide),
  // then the table reopens for betting.
  useEffect(() => {
    if (gameState.phase !== 'RESULT') return;

    const t = setTimeout(() => {
      setGameState((prev) => {
        if (prev.phase !== 'RESULT') return prev;
        return {
          ...prev,
          secondsLeft: 37,
          phase: 'BETTING',
          statusMessage: 'Place your chips',
          previousBets: prev.bets,
          bets: {},
          playStake: 0,
          winAmount: 0,
        };
      });
    }, 4000);

    return () => clearTimeout(t);
  }, [gameState.phase]);

  // Audio cues keyed to phase transitions and timer
  useEffect(() => {
    const currentPhase = gameState.phase;
    const prevPhase = prevPhaseRef.current;
    const seconds = gameState.secondsLeft;

    // BETTING phase just started → play place_your_bets
    if (currentPhase === 'BETTING' && prevPhase !== 'BETTING') {
      audio.stopAll();
      noMoreBetsPlayedRef.current = false;
      audio.play('place_your_bets');
    }

    // DRAWING phase just started → play wheel_spinning (looped); ring-stop chimes and the
    // loop's stop are handled by the draw-lifecycle effect above, in step with the wheel.
    if (currentPhase === 'DRAWING' && prevPhase !== 'DRAWING') {
      audio.stopAll();
      audio.play('wheel_spinning', true);
    }

    // Still in BETTING and timer just crossed ≤5 s → play no_more_bets once
    if (
      currentPhase === 'BETTING' &&
      seconds <= 5 &&
      prevSecondsRef.current > 5 &&
      !noMoreBetsPlayedRef.current
    ) {
      noMoreBetsPlayedRef.current = true;
      audio.stop('place_your_bets');
      audio.play('no_more_bets');
    }

    prevPhaseRef.current = currentPhase;
    prevSecondsRef.current = seconds;
  }, [gameState.phase, gameState.secondsLeft, audio]);

  const isLocked = gameState.phase !== 'BETTING' || gameState.secondsLeft <= 5;
  const hasBets = Object.keys(gameState.bets).length > 0;
  const hasPreviousBets = Object.keys(gameState.previousBets).length > 0;

  // Place Bet Handler
  const handlePlaceBet = (type: 'double' | 'triple' | 'single', value: number) => {
    if (isLocked) return;
    const chip = gameState.selectedChip;
    if (gameState.pointsBalance < chip) {
      setGameState((prev) => ({ ...prev, statusMessage: 'Insufficient points balance.' }));
      return;
    }

    const key = `${type}:${value}`;
    setGameState((prev) => {
      const currentStake = prev.bets[key] || 0;
      return {
        ...prev,
        pointsBalance: prev.pointsBalance - chip,
        playStake: prev.playStake + chip,
        bets: {
          ...prev.bets,
          [key]: currentStake + chip,
        },
      };
    });
    audio.play('place_bet_btn');
    setActiveTooltip({ type, value });
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setActiveTooltip(null);
    }, 3000);
  };

  // Prevent right-click context menu throughout the game
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Remove Bet Handler (Right click on cell - undo one step down by selected chip)
  const handleRemoveBet = (type: 'double' | 'triple' | 'single', value: number) => {
    if (isLocked) return;
    const key = `${type}:${value}`;
    const stake = gameState.bets[key];
    if (!stake) return;

    const chip = gameState.selectedChip;
    const decrement = Math.min(stake, chip);

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      if (stake - decrement <= 0) {
        delete nextBets[key];
      } else {
        nextBets[key] = stake - decrement;
      }
      return {
        ...prev,
        pointsBalance: prev.pointsBalance + decrement,
        playStake: Math.max(0, prev.playStake - decrement),
        bets: nextBets,
      };
    });
    audio.play('remove_bet_btn');
    if (stake - decrement > 0) {
      setActiveTooltip({ type, value });
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = setTimeout(() => {
        setActiveTooltip(null);
      }, 3000);
    } else if (activeTooltip?.type === type && activeTooltip?.value === value) {
      setActiveTooltip(null);
    }
  };

  // Quick Row Staking (Stakes selected chip across all 10 items in row)
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
    audio.play('place_bet_btn');
  };

  // Quick Col Staking (Stakes selected chip across all 10 items in column)
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
    audio.play('place_bet_btn');
  };

  // Quick Row Undo (Right click on row diamond - steps down all cells in row by selected chip)
  const handleQuickRowUndo = (section: 'double' | 'triple', row: number) => {
    if (isLocked) return;
    const chip = gameState.selectedChip;

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      const base = section === 'triple' ? prev.triplesTab * 100 : 0;
      let refunded = 0;

      for (let c = 0; c < 10; c++) {
        const val = base + row * 10 + c;
        const key = `${section}:${val}`;
        const currentStake = nextBets[key] || 0;
        if (currentStake > 0) {
          const decrement = Math.min(currentStake, chip);
          refunded += decrement;
          if (currentStake - decrement <= 0) {
            delete nextBets[key];
          } else {
            nextBets[key] = currentStake - decrement;
          }
        }
      }

      if (refunded === 0) return prev;

      return {
        ...prev,
        pointsBalance: prev.pointsBalance + refunded,
        playStake: Math.max(0, prev.playStake - refunded),
        bets: nextBets,
      };
    });
    audio.play('remove_bet_btn');
  };

  // Quick Col Undo (Right click on col diamond - steps down all cells in column by selected chip)
  const handleQuickColUndo = (section: 'double' | 'triple', col: number) => {
    if (isLocked) return;
    const chip = gameState.selectedChip;

    setGameState((prev) => {
      const nextBets = { ...prev.bets };
      const base = section === 'triple' ? prev.triplesTab * 100 : 0;
      let refunded = 0;

      for (let r = 0; r < 10; r++) {
        const val = base + r * 10 + col;
        const key = `${section}:${val}`;
        const currentStake = nextBets[key] || 0;
        if (currentStake > 0) {
          const decrement = Math.min(currentStake, chip);
          refunded += decrement;
          if (currentStake - decrement <= 0) {
            delete nextBets[key];
          } else {
            nextBets[key] = currentStake - decrement;
          }
        }
      }

      if (refunded === 0) return prev;

      return {
        ...prev,
        pointsBalance: prev.pointsBalance + refunded,
        playStake: Math.max(0, prev.playStake - refunded),
        bets: nextBets,
      };
    });
    audio.play('remove_bet_btn');
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
    audio.play('place_bet_btn');
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
    setActiveTooltip(null);
    setGameState((prev) => ({
      ...prev,
      pointsBalance: prev.pointsBalance + prev.playStake,
      playStake: 0,
      bets: {},
    }));
  };

  const isWin = gameState.phase === 'RESULT' || gameState.winAmount > 0;
  const currentDigits: [number, number, number] =
    gameState.phase === 'DRAWING'
      ? (drawTarget ?? wheelDigits)
      : gameState.drawResult
        ? digitsOf(gameState.drawResult.triple)
        : wheelDigits;
  const singleWinStake = isWin && gameState.drawResult ? gameState.bets[`single:${gameState.drawResult.single}`] : undefined;

  return (
    <div
      id="gametc-viewport-table"
      style={{
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: '1360px',
        height: '768px',
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Left: Doubles Section (00–99 Grid, Random Pick, Column & Row Arrows) */}
      <DoubleBoard
        gameId={gameState.gameId}
        bets={gameState.bets}
        winValue={isWin && gameState.drawResult ? gameState.drawResult.double : undefined}
        activeTooltipCell={
          activeTooltip?.type === 'double' ? activeTooltip.value : null
        }
        onPlaceBet={handlePlaceBet}
        onRemoveBet={handleRemoveBet}
        onQuickRow={(r) => handleQuickRow('double', r)}
        onQuickRowUndo={(r) => handleQuickRowUndo('double', r)}
        onQuickCol={(c) => handleQuickCol('double', c)}
        onQuickColUndo={(c) => handleQuickColUndo('double', c)}
        onRandomPick={(cnt) => handleRandomPick('double', cnt)}
        isLocked={isLocked}
        onToggleState={toggleMockState}
      />

      {/* Center Top: Concentric 3-Ring Wheel & Countdown Timer */}
      <WheelContainer
        secondsLeft={gameState.secondsLeft}
        isSpinning={gameState.phase === 'DRAWING'}
        drawStartTs={drawStartTs}
        fromDigits={wheelDigits}
        drawDigits={currentDigits}
        revealed={isWin ? 3 : revealed}
        isWinState={isWin}
      />

      {/* Right: Triples Section (000–999 Grid, Tabs, Random Pick, Column & Row Arrows) */}
      <TripleBoard
        activeTab={gameState.triplesTab}
        onTabChange={(t) => setGameState((prev) => ({ ...prev, triplesTab: t }))}
        bets={gameState.bets}
        winValue={isWin && gameState.drawResult ? gameState.drawResult.triple : undefined}
        activeTooltipCell={
          activeTooltip?.type === 'triple' ? activeTooltip.value : null
        }
        onPlaceBet={handlePlaceBet}
        onRemoveBet={handleRemoveBet}
        onQuickRow={(r) => handleQuickRow('triple', r)}
        onQuickRowUndo={(r) => handleQuickRowUndo('triple', r)}
        onQuickCol={(c) => handleQuickCol('triple', c)}
        onQuickColUndo={(c) => handleQuickColUndo('triple', c)}
        onRandomPick={(cnt) => handleRandomPick('triple', cnt)}
        isLocked={isLocked}
      />

      {/* Center Mid: Singles Bar (0–9) */}
      <SingleBoard
        bets={gameState.bets}
        winValue={isWin && gameState.drawResult ? gameState.drawResult.single : undefined}
        winStake={singleWinStake}
        winPayout={singleWinStake ? singleWinStake * PAYOUT.single : undefined}
        activeTooltipCell={
          activeTooltip?.type === 'single' ? activeTooltip.value : null
        }
        onPlaceBet={handlePlaceBet}
        onRemoveBet={handleRemoveBet}
        isLocked={isLocked}
      />

      {/* Left Bottom: Recent History Scoreboard & Play/Win Total Displays */}
      <ScoreboardPanel
        recentHistory={gameState.recentHistory}
        playStake={gameState.playStake}
        winAmount={gameState.winAmount}
      />

      {/* Center Bottom: 8-Denomination Chip Tray & Animated Status Blinker */}
      <ChipTray
        selectedChip={gameState.selectedChip}
        onSelectChip={(val) => setGameState((prev) => ({ ...prev, selectedChip: val }))}
        availableChips={gameState.availableChips}
        statusMessage={gameState.statusMessage}
      />

      {/* Right Bottom: Action Buttons (DOUBLE, REPEAT, INFO, CLEAR) */}
      <ActionBar
        hasBets={hasBets}
        hasPreviousBets={hasPreviousBets}
        isLocked={isLocked}
        onDouble={handleDouble}
        onRepeat={handleRepeat}
        onOpenInfo={() => setIsInfoOpen(true)}
        onClear={handleClear}
        onButtonClick={() => audio.play('button_click')}
      />

      {/* Info Dialog Modal Layer (Rules, Statement, History, Result, Report) */}
      <GameInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        recentHistory={gameState.recentHistory}
        onTabClick={() => audio.play('tab_btn_click')}
      />

      {/* ── Big Win (1000+) Transparent Coin Shower Video Overlay ─────────
          Rendered via WinVideoOverlay with real-time WebGL keying to
          remove the video's black background and composite cleanly.
      ──────────────────────────────────────────────────────────────────────── */}
      {showWinVideo && (
        <WinVideoOverlay
          src="/assets/0922.mp4"
          onEnded={handleWinVideoEnd}
        />
      )}
    </div>
  );
};
