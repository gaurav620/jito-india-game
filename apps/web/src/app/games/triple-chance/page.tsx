'use client';

import { PhaserWheel, type WheelTargetResult } from '@jito/game-core';
import {
  CasinoTopBar,
  OrnateFrame,
  GridCell,
  Chip,
  type ChipDenomination,
  Countdown,
  Button,
  Modal,
  Table,
  Tabs,
} from '@jito/ui';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

// Mock Recent History Data
interface ResultHistoryEntry {
  triple: string;
  double: string;
  single: string;
}

const INITIAL_HISTORY: ResultHistoryEntry[] = [
  { triple: '285', double: '85', single: '5' },
  { triple: '925', double: '25', single: '5' },
  { triple: '633', double: '33', single: '3' },
  { triple: '793', double: '93', single: '3' },
  { triple: '355', double: '55', single: '5' },
  { triple: '572', double: '72', single: '2' },
];

export default function TripleChanceTimerPage() {
  const router = useRouter();

  // Round State
  const [gameId, setGameId] = useState('736TC658');
  const [secondsLeft, setSecondsLeft] = useState(73);
  const [isLocked, setIsLocked] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(64707.0);
  const [playAmount, setPlayAmount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);

  // Wheel & Result State
  const [targetResult, setTargetResult] = useState<WheelTargetResult | null>(null);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [announcedResult, setAnnouncedResult] = useState<string | null>(null);
  const [history, setHistory] = useState<ResultHistoryEntry[]>(INITIAL_HISTORY);

  // Chip Selector
  const [selectedChip, setSelectedChip] = useState<ChipDenomination>(10);

  // Bets Map: cellKey -> betAmount
  const [doublesBets, setDoublesBets] = useState<Record<string, number>>({});
  const [triplesBets, setTriplesBets] = useState<Record<string, number>>({});
  const [singlesBets, setSinglesBets] = useState<Record<number, number>>({});

  // Triples Range Selector (000, 100, 200 ... 900)
  const [tripleRange, setTripleRange] = useState<number>(0);

  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'history' | 'report'>('none');
  const [reportStartDate, setReportStartDate] = useState('2026-09-08');
  const [reportEndDate, setReportEndDate] = useState('2026-09-08');

  // Simulated Countdown Tick
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // Handle placing a bet
  const handlePlaceDoublesBet = (numberStr: string) => {
    if (isLocked) return;
    setDoublesBets((prev) => {
      const current = prev[numberStr] || 0;
      const next = current + selectedChip;
      return { ...prev, [numberStr]: next };
    });
    setPlayAmount((prev) => prev + selectedChip);
    setPointsBalance((prev) => prev - selectedChip);
  };

  const handlePlaceTriplesBet = (numberStr: string) => {
    if (isLocked) return;
    setTriplesBets((prev) => {
      const current = prev[numberStr] || 0;
      const next = current + selectedChip;
      return { ...prev, [numberStr]: next };
    });
    setPlayAmount((prev) => prev + selectedChip);
    setPointsBalance((prev) => prev - selectedChip);
  };

  const handlePlaceSinglesBet = (singleNum: number) => {
    if (isLocked) return;
    setSinglesBets((prev) => {
      const current = prev[singleNum] || 0;
      const next = current + selectedChip;
      return { ...prev, [singleNum]: next };
    });
    setPlayAmount((prev) => prev + selectedChip);
    setPointsBalance((prev) => prev - selectedChip);
  };

  // Action Buttons
  const handleClearBets = () => {
    if (isLocked) return;
    setPointsBalance((prev) => prev + playAmount);
    setDoublesBets({});
    setTriplesBets({});
    setSinglesBets({});
    setPlayAmount(0);
    setWinAmount(0);
  };

  const handleDoubleBets = () => {
    if (isLocked) return;
    const additional = playAmount;
    setPointsBalance((prev) => prev - additional);
    setPlayAmount((prev) => prev * 2);

    const doubleMap = (map: Record<string, number>) => {
      const copy: Record<string, number> = {};
      Object.keys(map).forEach((k) => (copy[k] = map[k] * 2));
      return copy;
    };
    setDoublesBets((prev) => doubleMap(prev));
    setTriplesBets((prev) => doubleMap(prev));

    setSinglesBets((prev) => {
      const copy: Record<number, number> = {};
      Object.keys(prev).forEach((k) => {
        const num = Number(k);
        copy[num] = prev[num] * 2;
      });
      return copy;
    });
  };

  const handleRandomPick = (type: 'doubles' | 'triples') => {
    if (isLocked) return;
    if (type === 'doubles') {
      const rand = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
      handlePlaceDoublesBet(rand);
    } else {
      const rand = (tripleRange + Math.floor(Math.random() * 100))
        .toString()
        .padStart(3, '0');
      handlePlaceTriplesBet(rand);
    }
  };

  // Demo Simulation Controllers (Triggers 772 result observed in reference screenshot)
  const simulateFullResult772 = () => {
    setIsLocked(true);
    setSecondsLeft(0);
    setAnnouncedResult(null);

    // Give user a mock bet on 063 and 72 if empty
    setDoublesBets((prev) => ({ ...prev, '72': prev['72'] || 4 }));
    setTriplesBets((prev) => ({ ...prev, '063': prev['063'] || 4 }));
    setSinglesBets((prev) => ({ ...prev, 2: prev[2] || 4 }));
    setPlayAmount(12);

    // Trigger Wheel Spin to 772
    setTimeout(() => {
      setIsWheelSpinning(true);
      setTargetResult({ triple: 7, double: 7, single: 2 });
    }, 600);
  };

  const handleSpinFinished = (resultStr: string) => {
    setIsWheelSpinning(false);
    setAnnouncedResult(resultStr);

    // Win points calculation e.g. 3600 points observed in reference
    const awardedWin = 3600;
    setWinAmount(awardedWin);
    setPointsBalance((prev) => prev + awardedWin);

    // Append to history table
    setHistory((prev) => [
      {
        triple: resultStr,
        double: resultStr.slice(1, 3),
        single: resultStr.slice(2, 3),
      },
      ...prev.slice(0, 5),
    ]);
  };

  const resetRound = () => {
    setIsLocked(false);
    setSecondsLeft(84);
    setGameId('736TC' + Math.floor(100 + Math.random() * 900));
    setDoublesBets({});
    setTriplesBets({});
    setSinglesBets({});
    setPlayAmount(0);
    setWinAmount(0);
    setTargetResult(null);
    setAnnouncedResult(null);
    setIsWheelSpinning(false);
  };

  // Generate Doubles 00-99 array
  const doublesArray = Array.from({ length: 100 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  // Generate Triples 100 range array (e.g. 000-099)
  const triplesArray = Array.from({ length: 100 }, (_, i) =>
    (tripleRange + i).toString().padStart(3, '0')
  );

  const tripleRangeTabs = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <div className="min-h-screen bg-[#07070D] text-gray-100 flex flex-col justify-between select-none overflow-x-hidden">
      {/* 1. TOP APPLICATION BAR */}
      <CasinoTopBar
        gameTitle="Triple Chance Timer"
        gameId={gameId}
        username="PINTU"
        pointsBalance={pointsBalance}
        onLobbyClick={() => router.push('/games')}
        onClose={() => router.push('/games')}
        onMinimize={() => {}}
      />

      {/* 2. GAME WORKSPACE */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto p-2 sm:p-3 flex flex-col justify-between">
        {/* Sub-header: Game ID & Countdown */}
        <div className="flex items-center justify-between px-4 py-1 mb-1">
          <div className="flex items-center gap-3">
            <span className="font-black text-xs text-[#00E676] bg-black/60 px-2.5 py-1 rounded border border-[#00C853]/40 tracking-wider">
              GAME ID <strong className="text-white font-mono">{gameId}</strong>
            </span>
          </div>

          {/* Centered Large Numeric Countdown */}
          <Countdown seconds={secondsLeft} isLocked={isLocked} />

          {/* Modal Launch Triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('history')}
              className="px-3 py-1 rounded bg-gradient-to-b from-[#A5D6A7] via-[#2E7D32] to-[#1B5E20] text-white border border-[#FFE57F] text-xs font-black uppercase tracking-wider shadow hover:brightness-110 active:scale-95"
            >
              GAME HISTORY
            </button>
            <button
              onClick={() => setActiveModal('report')}
              className="px-3 py-1 rounded bg-gradient-to-b from-[#A5D6A7] via-[#2E7D32] to-[#1B5E20] text-white border border-[#FFE57F] text-xs font-black uppercase tracking-wider shadow hover:brightness-110 active:scale-95"
            >
              REPORT
            </button>
          </div>
        </div>

        {/* 3. MAIN GAME THREE-ZONE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* ── ZONE A: LEFT ZONE — DOUBLES (00–99) ── */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#0F0F1A] border-2 border-[#DAA520]/50 rounded-xl p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#DAA520]/30 mb-2">
              <span className="font-extrabold text-xs uppercase tracking-widest text-[#00E676] bg-[#004D20]/60 px-3 py-0.5 rounded border border-[#00C853]/40">
                DOUBLES
              </span>
              <span className="text-[10px] font-bold text-gray-400">Numbers 00–99</span>
            </div>

            {/* 10x10 Checkered Grid */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5 justify-items-center">
              {doublesArray.map((numStr, index) => {
                const row = Math.floor(index / 10);
                const col = index % 10;
                const isPink = (row + col) % 2 === 1;
                const bet = doublesBets[numStr];
                const isWinning = announcedResult
                  ? announcedResult.slice(1, 3) === numStr
                  : false;

                return (
                  <GridCell
                    key={numStr}
                    label={numStr}
                    isPink={isPink}
                    isSelected={Boolean(bet)}
                    betAmount={bet}
                    isWinning={isWinning}
                    disabled={isLocked}
                    onClick={() => handlePlaceDoublesBet(numStr)}
                  />
                );
              })}
            </div>

            {/* Quick Picks for Doubles */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20, 25, 50, 75].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      // Bet top row with quick value
                      const rand = Math.floor(Math.random() * 100)
                        .toString()
                        .padStart(2, '0');
                      handlePlaceDoublesBet(rand);
                    }}
                    className="w-7 h-6 rounded bg-[#1C1608] hover:bg-[#2C2208] text-[#FFE57F] border border-[#DAA520]/60 font-black text-[10px] flex items-center justify-center shadow active:scale-95 disabled:opacity-40"
                  >
                    {val}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => handleRandomPick('doubles')}
                className="px-2 py-1 rounded bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-black text-[10px] uppercase tracking-wider shadow hover:brightness-110 active:scale-95 disabled:opacity-40"
              >
                RANDOM PICK
              </button>
            </div>
          </div>

          {/* ── ZONE B: CENTER ZONE — WHEEL & SINGLES ── */}
          <div className="lg:col-span-4 flex flex-col items-center justify-between bg-[#12121E] border-2 border-[#FFE57F]/40 rounded-xl p-3 shadow-[0_4px_25px_rgba(255,215,0,0.15)] relative">
            {/* The Concentric 3-Ring Wheel */}
            <div className="my-auto py-2">
              <PhaserWheel
                targetResult={targetResult}
                isSpinning={isWheelSpinning}
                onSpinComplete={handleSpinFinished}
                size={340}
              />
            </div>

            {/* Singles Selection Bar (0 1 2 3 4 5 6 7 8 9) */}
            <div className="w-full mt-2 pt-2 border-t border-[#DAA520]/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-xs uppercase tracking-widest text-[#00E676] bg-[#004D20]/60 px-3 py-0.5 rounded border border-[#00C853]/40">
                  SINGLES
                </span>
                <span className="text-[10px] font-bold text-gray-400">Single Digits 0–9</span>
              </div>

              <div className="grid grid-cols-10 gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const isPink = digit % 2 === 1;
                  const bet = singlesBets[digit];
                  const isWinning = announcedResult
                    ? Number(announcedResult.slice(2, 3)) === digit
                    : false;

                  return (
                    <GridCell
                      key={digit}
                      label={digit.toString()}
                      isPink={isPink}
                      isSelected={Boolean(bet)}
                      betAmount={bet}
                      isWinning={isWinning}
                      disabled={isLocked}
                      onClick={() => handlePlaceSinglesBet(digit)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── ZONE C: RIGHT ZONE — TRIPLES (000–999) ── */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#0F0F1A] border-2 border-[#DAA520]/50 rounded-xl p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#DAA520]/30 mb-2">
              <span className="font-extrabold text-xs uppercase tracking-widest text-[#00E676] bg-[#004D20]/60 px-3 py-0.5 rounded border border-[#00C853]/40">
                TRIPLES
              </span>
              <span className="text-[10px] font-bold text-gray-400">Range 000–999</span>
            </div>

            {/* Range Tabs (000, 100, 200 ... 900) */}
            <div className="flex items-center justify-between gap-0.5 mb-2 overflow-x-auto pb-1">
              {tripleRangeTabs.map((rangeVal) => (
                <button
                  key={rangeVal}
                  type="button"
                  onClick={() => setTripleRange(rangeVal)}
                  className={`px-1.5 py-1 rounded text-[10px] font-black tracking-tighter transition-all ${
                    tripleRange === rangeVal
                      ? 'bg-[#FFD700] text-black shadow-md scale-105'
                      : 'bg-[#1C1C28] text-gray-300 hover:bg-[#2A2A3C] border border-white/5'
                  }`}
                >
                  {rangeVal.toString().padStart(3, '0')}
                </button>
              ))}
            </div>

            {/* 10x10 Checkered Grid for Current Triples Range */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5 justify-items-center">
              {triplesArray.map((numStr, index) => {
                const row = Math.floor(index / 10);
                const col = index % 10;
                const isPink = (row + col) % 2 === 1;
                const bet = triplesBets[numStr];
                // In reference win state, cell 063 displays floating badge: Play 4, Win 3600
                const isWinning = announcedResult === numStr || (announcedResult === '772' && numStr === '063');
                const cellWin = isWinning ? 3600 : undefined;

                return (
                  <GridCell
                    key={numStr}
                    label={numStr}
                    isPink={isPink}
                    isSelected={Boolean(bet)}
                    betAmount={bet}
                    isWinning={isWinning}
                    winAmount={cellWin}
                    disabled={isLocked}
                    onClick={() => handlePlaceTriplesBet(numStr)}
                  />
                );
              })}
            </div>

            {/* Quick Picks for Triples */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => handleRandomPick('triples')}
                className="px-2 py-1 rounded bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-black text-[10px] uppercase tracking-wider shadow hover:brightness-110 active:scale-95 disabled:opacity-40"
              >
                RANDOM PICK
              </button>
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      const rand = (tripleRange + Math.floor(Math.random() * 100))
                        .toString()
                        .padStart(3, '0');
                      handlePlaceTriplesBet(rand);
                    }}
                    className="w-7 h-6 rounded bg-[#1C1608] hover:bg-[#2C2208] text-[#FFE57F] border border-[#DAA520]/60 font-black text-[10px] flex items-center justify-center shadow active:scale-95 disabled:opacity-40"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM BAR: RECENT HISTORY + CHIP TRAY + ACTION BUTTONS */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Bottom Left: Result History Table + PLAY & WIN Points Counters */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <div className="bg-[#12121A] border border-[#DAA520]/40 rounded-lg p-2 overflow-x-auto shadow">
              <table className="w-full text-center text-xs font-black">
                <tbody>
                  <tr className="border-b border-white/10 text-gray-400">
                    <td className="text-left text-[#FFD700] px-2 py-0.5">Triple</td>
                    {history.map((h, i) => (
                      <td key={i} className="px-1.5 py-0.5 font-mono text-white">
                        {h.triple}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/10 text-gray-400">
                    <td className="text-left text-[#00E676] px-2 py-0.5">Double</td>
                    {history.map((h, i) => (
                      <td key={i} className="px-1.5 py-0.5 font-mono text-emerald-400">
                        {h.double}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-gray-400">
                    <td className="text-left text-[#E91E63] px-2 py-0.5">Single</td>
                    {history.map((h, i) => (
                      <td key={i} className="px-1.5 py-0.5 font-mono text-pink-400">
                        {h.single}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PLAY & WIN Points Display (Observed in reference screenshots) */}
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-1.5 rounded-lg bg-black border border-gray-700 flex items-center justify-between shadow">
                <span className="font-extrabold text-xs text-[#DAA520] tracking-wider">PLAY :</span>
                <span className="font-mono font-black text-base text-[#00E676]">{playAmount}</span>
              </div>
              <div className="flex-1 px-4 py-1.5 rounded-lg bg-black border border-[#FFD700] flex items-center justify-between shadow-[0_0_12px_rgba(255,215,0,0.3)]">
                <span className="font-extrabold text-xs text-[#FFE57F] tracking-wider">WIN :</span>
                <span className="font-mono font-black text-base text-yellow-300 animate-pulse">{winAmount}</span>
              </div>
            </div>
          </div>

          {/* Bottom Center: Chip Selector Tray */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <OrnateFrame variant="gold-tray" className="w-full">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {([2, 5, 10, 20, 30, 40, 50, 100, 500] as const).map((denom) => (
                  <Chip
                    key={denom}
                    value={denom}
                    isSelected={selectedChip === denom}
                    onClick={() => setSelectedChip(denom)}
                    disabled={isLocked}
                    size="md"
                  />
                ))}
              </div>
            </OrnateFrame>
            <div className="mt-1 text-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#FFD700] drop-shadow">
                {isLocked ? 'Betting Closed • Round In Progress' : 'Place your chips'}
              </span>
            </div>
          </div>

          {/* Bottom Right: Action Buttons (DOUBLE, REPEAT, INFO, CLEAR) */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            <Button
              variant="chip-action"
              size="md"
              disabled={isLocked || playAmount === 0}
              onClick={handleDoubleBets}
            >
              DOUBLE
            </Button>
            <Button
              variant="chip-action"
              size="md"
              disabled={isLocked}
              onClick={() => {
                // Repeat bets
                setPlayAmount((p) => p);
              }}
            >
              REPEAT
            </Button>
            <Button
              variant="chip-action"
              size="md"
              onClick={() => setActiveModal('history')}
            >
              INFO
            </Button>
            <Button
              variant="chip-action"
              size="md"
              disabled={isLocked || playAmount === 0}
              onClick={handleClearBets}
            >
              CLEAR
            </Button>
          </div>
        </div>

        {/* 5. PHASE 1 INTERACTIVE DEMO CONTROLLER */}
        <div className="mt-4 p-2.5 rounded-xl bg-gradient-to-r from-[#1A1A2E] via-[#2A1F05] to-[#1A1A2E] border border-[#DAA520]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-extrabold uppercase tracking-wider text-[#FFD700]">
              Phase 1 Visual Prototype Simulator:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                handlePlaceDoublesBet('72');
                handlePlaceTriplesBet('063');
                handlePlaceSinglesBet(2);
              }}
              className="px-2.5 py-1 rounded bg-[#2A2A3C] hover:bg-[#3A3A50] text-gray-200 font-bold border border-white/10"
            >
              1. Place Sample Bets (063, 72, 2)
            </button>
            <button
              onClick={() => setIsLocked(true)}
              className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 font-bold border border-red-500/40"
            >
              2. Lock Betting
            </button>
            <button
              onClick={simulateFullResult772}
              className="px-2.5 py-1 rounded bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black border border-yellow-300 shadow"
            >
              3. Spin Wheel & Reveal 772 (Win 3600)
            </button>
            <button
              onClick={resetRound}
              className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-bold border border-emerald-500/40"
            >
              4. Reset Round
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. GAME HISTORY & REPORT MODALS (Recreates reference modals) ── */}
      <Modal
        isOpen={activeModal !== 'none'}
        onClose={() => setActiveModal('none')}
      >
        <div className="flex flex-col gap-4">
          {/* Top Modal Tabs: GAME HISTORY vs REPORT */}
          <Tabs
            tabs={[
              { id: 'history', label: 'GAME HISTORY' },
              { id: 'report', label: 'REPORT' },
            ]}
            activeTab={activeModal}
            onChange={(id) => setActiveModal(id as 'history' | 'report')}
          />

          {/* Modal Tab Content */}
          {activeModal === 'history' ? (
            <div>
              <Table
                columns={[
                  { header: 'S NO', accessor: 'sno' },
                  { header: 'Game ID', accessor: 'gameId' },
                  { header: 'Played', accessor: 'played' },
                  { header: 'Won', accessor: 'won' },
                ]}
                data={[
                  { sno: 1, gameId: '623TC2314', played: 40, won: 0 },
                  { sno: 2, gameId: '736TC658', played: 4, won: 3600 },
                  { sno: 3, gameId: '736TC657', played: 20, won: 0 },
                  { sno: 4, gameId: '736TC656', played: 50, won: 450 },
                  { sno: 5, gameId: '736TC655', played: 10, won: 0 },
                ]}
                keyExtractor={(r) => r.sno}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Table
                columns={[
                  { header: 'DATE', accessor: 'date' },
                  { header: 'SALE POINT', accessor: 'salePoint' },
                  { header: 'WIN POINT', accessor: 'winPoint' },
                  { header: 'END', accessor: 'end' },
                  { header: 'COMMI POINT', accessor: 'commiPoint' },
                  { header: 'NTP POINT', accessor: 'ntpPoint' },
                ]}
                data={[
                  {
                    date: '08-09-2026',
                    salePoint: '962.00',
                    winPoint: '198.00',
                    end: '764.00',
                    commiPoint: '34.00',
                    ntpPoint: '730.00',
                  },
                  {
                    date: '07-09-2026',
                    salePoint: '1,420.00',
                    winPoint: '560.00',
                    end: '860.00',
                    commiPoint: '52.00',
                    ntpPoint: '808.00',
                  },
                ]}
                keyExtractor={(r) => r.date}
              />

              {/* Date Filters matching reference screenshot */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D4AF37]/30 text-xs font-black text-[#332200]">
                <div className="flex items-center gap-2">
                  <span>FROM</span>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="px-2 py-1 rounded border border-[#D4AF37] bg-white font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span>TO</span>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="px-2 py-1 rounded border border-[#D4AF37] bg-white font-mono text-xs"
                  />
                </div>

                <button
                  type="button"
                  className="px-6 py-1.5 rounded-lg bg-gradient-to-b from-[#A5D6A7] via-[#2E7D32] to-[#1B5E20] text-white font-black text-xs uppercase tracking-wider border border-[#FFE57F] shadow hover:brightness-110 active:scale-95"
                >
                  VIEW
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
