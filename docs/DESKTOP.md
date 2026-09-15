# JITO INDIA GAMES — Desktop Application Specification (Electron)

> Version: 1.1 | Date: 2026-09-08

---

## 1. Overview

The desktop client is a native Windows application built with Electron, delivering a dedicated, full-screen arcade experience for players with zero browser UI distractions.

## 2. Window Architecture

- **Frameless Window**: Custom application bar implemented via `<CasinoTopBar />` in React with custom minimize, maximize, and close buttons.
- **Resolution Targets**: Designed for 1440x900 and 1920x1080 standard desktop monitors; responsive down to 1024x768.
- **Kiosk & Fullscreen Support**: Toggleable kiosk mode for gaming terminal venues.

## 3. Security Hardening

- `contextIsolation: true` — renderer cannot access Node.js internals directly.
- `nodeIntegration: false` — prevents remote code execution vulnerabilities.
- `sandbox: true` — runs renderer processes inside a Chromium sandbox.
- Explicit `preload.ts` bridge exposing safe window controls via `window.electronAPI`.

## 4. Build & Distribution

- Packaged with `electron-builder` producing `JitoGames-Setup.exe`.
- Code signing certificate configuration for Windows SmartScreen trust.
