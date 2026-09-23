'use client';

import React, { useState } from 'react';

import { GameCard } from './GameCard';

export interface LobbyMainPanelProps {
  onPlayGame?: (gameId: string) => void;
}

interface CategoryInfo {
  id: number;
  name: string;
  panelAsset: string;
}

const CATEGORIES: CategoryInfo[] = [
  { id: 1, name: 'ROULETTE GAMES', panelAsset: '/assets/lobby/panels/SET_1_box.webp' },
  { id: 2, name: 'DRAW GAMES', panelAsset: '/assets/lobby/panels/SET_2box.webp' },
  { id: 3, name: 'SLOT GAMES', panelAsset: '/assets/lobby/panels/SET_3box.webp' },
  { id: 4, name: 'TABLE GAMES', panelAsset: '/assets/lobby/panels/SET_4box.webp' },
  { id: 5, name: 'SCRATCH GAMES', panelAsset: '/assets/lobby/panels/SET_5box.webp' },
];

export const LobbyMainPanel: React.FC<LobbyMainPanelProps> = ({ onPlayGame }) => {
  const [activeTab, setActiveTab] = useState<number>(2); // Default to Draw Games as in screenshot

  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[1];

  return (
    <div
      id="lobby-main-panel"
      style={{
        position: 'absolute',
        left: '90px',
        top: '152px',
        width: '1180px',
        height: '593px',
        backgroundImage: `url('${currentCategory.panelAsset}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        zIndex: 20,
      }}
    >
      {/* Category Heading Title */}
      <div
        id="lobby-category-title"
        style={{
          position: 'absolute',
          left: '40px',
          top: '20px',
          fontFamily: "'HERMESC', sans-serif",
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          letterSpacing: '1px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
          pointerEvents: 'none',
        }}
      >
        {currentCategory.name}
      </div>

      {/* Game Cards Grid Area */}
      <div
        id="lobby-game-grid"
        style={{
          position: 'absolute',
          left: '50px',
          top: '100px',
          width: '1080px',
          height: '340px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
        }}
      >
        {activeTab === 2 ? (
          <>
            {/* 1. Spin2Win Pro Timer */}
            <GameCard
              id="spin2win-pro"
              title="SPIN2WIN PRO TIMER"
              image="/lobby/spin2win-card.png"
              onClick={() => onPlayGame?.('spin2win-pro')}
            />

            {/* 2. Triple Chance Timer */}
            <GameCard
              id="triple-chance"
              title="TRIPLE CHANCE TIMER"
              image="/lobby/triple-chance-card.png"
              onClick={() => onPlayGame?.('triple-chance')}
            />

            {/* 3. Triple Chance Pro Timer */}
            <GameCard
              id="triple-chance-pro"
              title="TRIPLE CHANCE PRO TIMER"
              image="/lobby/triple-chance-pro-card.png"
              onClick={() => onPlayGame?.('triple-chance-pro')}
            />
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'HERMESC', sans-serif",
              fontSize: '24px',
              color: '#d1d5db',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            Games coming soon
          </div>
        )}
      </div>

      {/* Interactive Bottom Category Navigation Click Targets */}
      <div
        id="lobby-category-dock"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '1180px',
          height: '110px',
          zIndex: 30,
        }}
      >
        {/* Tab 1: Roulette Games */}
        <button
          type="button"
          id="category-tab-roulette"
          onClick={() => setActiveTab(1)}
          style={{
            position: 'absolute',
            left: '35px',
            bottom: '5px',
            width: '190px',
            height: '95px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Roulette Games"
          aria-label="Roulette Games"
        />

        {/* Tab 2: Draw Games (Active in screenshot) */}
        <button
          type="button"
          id="category-tab-draw"
          onClick={() => setActiveTab(2)}
          style={{
            position: 'absolute',
            left: '240px',
            bottom: '5px',
            width: '205px',
            height: '105px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Draw Games"
          aria-label="Draw Games"
        />

        {/* Tab 3: Slot Games */}
        <button
          type="button"
          id="category-tab-slots"
          onClick={() => setActiveTab(3)}
          style={{
            position: 'absolute',
            left: '460px',
            bottom: '5px',
            width: '190px',
            height: '95px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Slot Games"
          aria-label="Slot Games"
        />

        {/* Tab 4: Table Games */}
        <button
          type="button"
          id="category-tab-table"
          onClick={() => setActiveTab(4)}
          style={{
            position: 'absolute',
            left: '670px',
            bottom: '5px',
            width: '190px',
            height: '95px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Table Games"
          aria-label="Table Games"
        />

        {/* Tab 5: Scratch Games */}
        <button
          type="button"
          id="category-tab-scratch"
          onClick={() => setActiveTab(5)}
          style={{
            position: 'absolute',
            left: '880px',
            bottom: '5px',
            width: '190px',
            height: '95px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Scratch Games"
          aria-label="Scratch Games"
        />
      </div>
    </div>
  );
};
