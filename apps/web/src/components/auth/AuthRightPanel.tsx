import React from 'react';

import { JitoLogo } from '@/components/branding/JitoLogo';

export const AuthRightPanel: React.FC = () => {
  return (
    <>
      {/* instruction card (Login_page_pop.webp) */}
      <div
        style={{
          position: 'absolute',
          left: '601px',
          top: '100px',
          width: '620px',
          height: '450px',
          backgroundImage: "url('/assets/auth/backgrounds/Login_page_pop.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          zIndex: 20,
        }}
      >
        {/* Official Jito India Games Logo centered on the top arch cutout */}
        <div
          style={{
            position: 'absolute',
            left: '110px',
            top: '-30px',
            width: '395px',
            height: '272px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 25,
          }}
        >
          <JitoLogo width={395} height={250} priority />
        </div>
      </div>

      {/* Free to Play Emblem at bottom right overlapping the dice */}
      <div
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '40px',
          width: '245px',
          height: '135px',
          backgroundImage: "url('/assets/auth/badges/Free_to_play_icon.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      />
    </>
  );
};
