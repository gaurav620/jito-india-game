# JITO INDIA GAMES — Android Mobile Application Specification (Capacitor)

> Version: 1.1 | Date: 2026-09-08

---

## 1. Overview

The mobile application packages the shared Next.js / React / Phaser web frontend into a native Android application using Capacitor (`com.jitoindia.games`).

## 2. Responsive Game Adaptation

- **Orientation Lock**: Default locked to landscape mode for game tables to preserve the fundamental 3-zone layout (Doubles left, Wheel center, Triples right).
- **High-DPI Touch Scaling**: Chip selectors and number grid cells are sized for accurate touch targeting on 7-inch to 12-inch tablets and mobile devices.
- **Hardware Acceleration**: WebGL canvas acceleration enabled for 60 FPS Phaser wheel animations.

## 3. Distribution

- Packaged as a standalone APK (`JitoGames.apk`) distributed via the public website download center (`/download`).
- Minimum SDK: Android 8.0 (API 26) or higher.
