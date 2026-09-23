'use client';

import { useCallback, useEffect, useRef } from 'react';

const AUDIO_FILES = {
  place_your_bets:   '/audio/place_your_bets.WAV',
  no_more_bets:      '/audio/no_more_bets.WAV',
  wheel_spinning:    '/audio/wheel_spinning.WAV',
  wheel_point_chime: '/audio/wheel_point_chime.WAV',
  button_click:      '/audio/button_click.WAV',
  tab_btn_click:     '/audio/tab_btn_click.WAV',
  place_bet_btn:     '/audio/place_bet_btn.WAV',
  remove_bet_btn:    '/audio/remove_bet_btn.WAV',
  you_win:           '/audio/you_win.WAV',
} as const;

type AudioKey = keyof typeof AUDIO_FILES;

/**
 * Manages game audio cues.
 *
 * - place_your_bets   → round start (BETTING phase begins)
 * - no_more_bets      → timer hits ≤5 s during BETTING
 * - wheel_spinning    → DRAWING phase (looped)
 * - wheel_point_chime → played 3× on RESULT (one per digit), via playChimes()
 * - button_click      → action bar buttons (DOUBLE, REPEAT, INFO, CLEAR)
 * - tab_btn_click     → info modal tab buttons
 * - place_bet_btn     → left-click on a cell to place a bet
 * - remove_bet_btn    → right-click on a cell to remove a bet
 * - you_win           → played on RESULT when user wins points
 */
export function useGameAudio() {
  const refs = useRef<Partial<Record<AudioKey, HTMLAudioElement>>>({});
  const chimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAutoplayRef = useRef<{ key: AudioKey; loop: boolean } | null>(null);

  // Preload all sounds on mount, clean up on unmount
  useEffect(() => {
    const entries = Object.entries(AUDIO_FILES) as [AudioKey, string][];
    entries.forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      refs.current[key] = audio;
    });

    return () => {
      if (chimeTimer.current) clearTimeout(chimeTimer.current);
      Object.values(refs.current).forEach((audio) => {
        if (audio) { audio.pause(); audio.src = ''; }
      });
      refs.current = {};
    };
  }, []);

  const getOrCreateAudio = useCallback((key: AudioKey): HTMLAudioElement | undefined => {
    let audio = refs.current[key];
    if (!audio && typeof window !== 'undefined') {
      audio = new Audio(AUDIO_FILES[key]);
      audio.preload = 'auto';
      refs.current[key] = audio;
    }
    return audio;
  }, []);

  const stop = useCallback((key: AudioKey) => {
    if (pendingAutoplayRef.current?.key === key) {
      pendingAutoplayRef.current = null;
    }
    const audio = refs.current[key];
    if (!audio) return;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // Ignore if not seekable yet
    }
  }, []);

  const play = useCallback((key: AudioKey, loop = false) => {
    const audio = getOrCreateAudio(key);
    if (!audio) return;
    audio.loop = loop;
    try {
      audio.currentTime = 0;
    } catch {
      // Ignore if not seekable yet
    }
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err: unknown) => {
        // Autoplay policy: if blocked because user hasn't interacted yet, queue for first gesture
        if (err && typeof err === 'object' && 'name' in err) {
          const e = err as { name: string };
          if (e.name === 'NotAllowedError' || e.name === 'AbortError') {
            pendingAutoplayRef.current = { key, loop };
          }
        }
      });
    }
  }, [getOrCreateAudio]);

  const stopAll = useCallback(() => {
    pendingAutoplayRef.current = null;
    (Object.keys(AUDIO_FILES) as AudioKey[]).forEach(stop);
  }, [stop]);

  // Listener to resume pending playback on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      if (pendingAutoplayRef.current) {
        const { key, loop } = pendingAutoplayRef.current;
        pendingAutoplayRef.current = null;
        play(key, loop);
      }
    };

    window.addEventListener('pointerdown', handleGesture, { capture: true });
    window.addEventListener('keydown', handleGesture, { capture: true });

    return () => {
      window.removeEventListener('pointerdown', handleGesture, { capture: true });
      window.removeEventListener('keydown', handleGesture, { capture: true });
    };
  }, [play]);

  /**
   * Plays wheel_point_chime `count` times, each separated by `spacingMs`.
   * Cancels any in-progress chime sequence before starting a new one.
   */
  const playChimes = useCallback((count: number, spacingMs = 900) => {
    if (chimeTimer.current) clearTimeout(chimeTimer.current);
    let fired = 0;

    const fireNext = () => {
      if (fired >= count) return;
      play('wheel_point_chime');
      fired++;
      if (fired < count) {
        chimeTimer.current = setTimeout(fireNext, spacingMs);
      }
    };

    fireNext();
  }, [play]);

  return { play, stop, stopAll, playChimes };
}
