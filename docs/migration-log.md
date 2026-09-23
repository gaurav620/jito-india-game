# Migration Log: Splash Screen Migration

## 1. Reference
- **Repository:** `pr-project-2-main`
- **Source Artifacts & Components:**
  - `apps/client/public/legacy/ui/Loader_Bg_3.webp` (1360×768 extracted Unity layout artwork)
  - `apps/client/public/legacy/fonts/GOTHAMCONDENSED-MEDIUM.otf` (legacy font)
  - `apps/client/public/legacy/ui/Loader_Red_0.webp` (red circular spinner)
  - `apps/client/public/legacy/ui/shape_63.webp` (slider track sprite)
  - `apps/client/public/legacy/ui/1_Pixel_loder.webp` (slider fill sprite)
  - `apps/client/src/components/Logo.tsx` (JITO INDIA GAMES vector marquee logo)
  - `apps/client/src/unity/level1.layout.json` (`UpdatePanel` & `LoadingPanel` nodes)

---

## 2. Target
- **Repository:** `jito-india-game`
- **Application:** `apps/web` (Next.js 14 App Router) & `@jito/ui`

---

## 3. What Was Migrated
- **Visual Design & Assets:** The authentic 1360×768 red geometric update panel background (`Loader_Bg_3.webp`), slider track (`shape_63.webp`), slider fill (`1_Pixel_loder.webp`), and spinner (`Loader_Red_0.webp`).
- **Logo Component & Asset:** The splash screen integrates the original official repository logo asset (`/jito-india-logo.png` - with the rich red sunburst marquee, roulette wheel, cards, and 50 chip) rendered with high-priority Next.js `Image`, positioned above the central update box with depth drop-shadows.
- **Typography:** Extracted `Gotham Condensed Medium` font (`GOTHAMCONDENSED-MEDIUM.otf`) loaded via `@font-face` in `globals.css` and applied to the update status label.
- **Progress Behavior & Animations:** 0% → 100% progress ticker, animated red chaser spinner, width-interpolated fill bar, and smooth opacity fade-out before transitioning.
- **Stage Scaling:** Fixed 1360×768 aspect ratio container scaled to fit any browser window/device without stretching, centered with deep maroon letterboxing (`#140001`).

---

## 4. Files Added
- `apps/web/public/assets/splash/backgrounds/Loader_Bg_3.webp` — High-resolution 1360×768 geometric splash background.
- `apps/web/public/assets/splash/fonts/GOTHAMCONDENSED-MEDIUM.otf` — Legacy font for update text.
- `apps/web/public/assets/splash/images/Loader_Red_0.webp` — Red circular spinner texture.
- `apps/web/public/assets/splash/images/shape_63.webp` — Recessed slider track texture.
- `apps/web/public/assets/splash/images/1_Pixel_loder.webp` — Red slider fill texture.
- `packages/ui/src/components/logo.tsx` — Reusable vector marquee logo component.
- `apps/web/src/components/splash/SplashScreen.tsx` — Modular client component implementing stage scaling, asset rendering, animation, and completion handling.
- `docs/migration-log.md` — This comprehensive migration record.

---

## 5. Files Modified
- `packages/ui/src/index.ts`:
  - **Reason:** Exported `Logo` component from `@jito/ui` so it can be shared across web, desktop, and admin apps.
- `apps/web/src/app/layout.tsx`:
  - **Reason:** Added `Kaushan Script` and `Oswald` to the Google Fonts preconnect link to support typography in the vector logo.
- `apps/web/src/app/globals.css`:
  - **Reason:** Added `@font-face` definition for `GOTHAMCONDENSED-MEDIUM` referencing `/assets/splash/fonts/GOTHAMCONDENSED-MEDIUM.otf`.
- `apps/web/src/app/splash/page.tsx`:
  - **Reason:** Replaced old inline implementation with modular `<SplashScreen onComplete={() => router.push('/login')} />`, preserving the existing Next.js App Router route and navigation flow.

---

## 6. Files Deleted
- `apps/web/public/splash-screen/bg.png`
  - **Reason:** Obsolete 43 KB generic grid image. Replaced by authentic `Loader_Bg_3.webp`. Verified zero remaining code references before deletion.
- Directory `apps/web/public/splash-screen/` removed.

---

## 7. Reference → Next.js Adaptations
- **Routing & State:** The reference project used an in-memory state machine (`appStore.ts` with `screen: 'boot'`) without browser URLs. In `jito-india-game`, the splash screen is seamlessly integrated into the existing Next.js App Router at `/splash`, transitioning to `/login` via `useRouter().push('/login')` upon 100% completion.
- **Component Architecture:** Extracted layout logic from Unity JSON runtime solver into a modular React client component (`SplashScreen.tsx`) utilizing Next.js styling and client-side boundary (`'use client'`).
- **Resolution Handling:** Maintained the 1360×768 reference canvas using responsive CSS matrix scaling (`Math.min(vw / 1360, vh / 768)`) with letterboxing, ensuring mobile and ultrawide monitors render without asset distortion.
- **Route Preservation:** No existing routes were renamed, moved, or deleted. `/`, `/login`, `/register`, `/splash`, `/download`, and `/games/*` remain completely intact.

---

## 8. Dependencies
- **Added:** None. Built entirely using existing dependencies (`react`, `next`, `tailwindcss`, `@jito/ui`).
- **Removed:** None.

---

## 9. Testing & Verification
- **Type Checking:** Ran `npm run typecheck` across all workspaces (`packages/*`, `services/*`). Passed with 0 errors.
- **Production Build:** Ran `npm run build:web` (`next build`). Compiled successfully; all 11 static pages generated including `/splash` (1.67 kB).
- **HTTP Endpoints & Asset Delivery:** Validated HTTP 200 responses and byte lengths for:
  - `/splash` (200 OK)
  - `/assets/splash/backgrounds/Loader_Bg_3.webp` (200 OK, 34,058 bytes)
  - `/assets/splash/fonts/GOTHAMCONDENSED-MEDIUM.otf` (200 OK, 28,564 bytes)
  - `/assets/splash/images/shape_63.webp` (200 OK, 5,888 bytes)
  - `/assets/splash/images/1_Pixel_loder.webp` (200 OK, 5,864 bytes)

---

# Migration Log: Authentication UI Implementation (Login & Registration)

## 1. Reference
- **Repository:** `pr-project-2-main`
- **Source Artifacts & Layout Specs:**
  - `apps/client/src/unity/level1.layout.json` (`Login_Page` and `Reg_Page` layout trees, 1360×768 coordinate space)
  - `apps/client/public/legacy/ui/BG_login.webp` (1360×768 dark casino backdrop)
  - `apps/client/public/legacy/ui/Login_page_pop.webp` (decorative right panel framing)
  - `apps/client/public/legacy/ui/login_Page_sup_1.webp` (login inner form panel)
  - `apps/client/public/legacy/ui/login_Page_sup_2.webp` (inset input field background)
  - `apps/client/public/legacy/ui/Reg_page_0.webp` (registration modal card backdrop)
  - `apps/client/public/legacy/ui/Reg_and_Login_0.webp` (registration input field background)
  - `apps/client/public/legacy/ui/sprite_220001.webp` / `sprite_220002.webp` (red login submit button states)
  - `apps/client/public/legacy/ui/normal.webp` / `sprite_1173wq0001.webp` (green register submit button states)
  - `apps/client/public/legacy/ui/tickBG.webp` / `tick.webp` (checkbox states)
  - `apps/client/public/legacy/ui/sprite_94xdf0001.webp` / `sprite_94xdf0002.webp` (radio selection states)
  - `apps/client/public/legacy/ui/18plus.webp` (18+ statutory badge)
  - `apps/client/public/legacy/ui/Free_to_play_icon.webp` (free to play seal)
  - `apps/client/public/legacy/ui/login_Page_sup_0.webp` (close/dismiss icon)

---

## 2. Target
- **Repository:** `jito-india-game`
- **Application:** `apps/web` (Next.js 14 App Router)
- **Routes Covered:**
  - `/login`
  - `/register`

---

## 3. What Was Migrated & Implemented
- **Visual Presentation & Responsive 1360×768 Stage:**
  - Fixed aspect ratio letterboxed container (`AuthStage.tsx`) dynamically scaled to viewport width and height (`Math.min(vw / 1360, vh / 768)`).
  - Authentic dark casino room background with ambient lighting and window bezel.
  - Right decorative art panel (`AuthRightPanel.tsx`) housing the authentic Jito India Games logo and 18+ statutory badge.
- **Login Component (`LoginForm.tsx`):**
  - Beveled inset inputs for username and password with authentic textures (`login_Page_sup_2.webp`).
  - Toggle show/hide password visibility with eye indicator.
  - "Remember Me" checkbox with custom textures (`tickBG.webp`, `tick.webp`).
  - Red pushed-bezel action button with smooth hover and click transitions (`sprite_220001.webp`, `sprite_220002.webp`).
  - "Create New Account" navigation link switching to registration view.
  - Inline error alert box and animated spinner loading state.
- **Registration Component (`RegisterForm.tsx`):**
  - Registration modal overlay (`Reg_page_0.webp`) with close button dismiss.
  - Text fields for Username and Email address with regex email validation.
  - Interactive Gender selector (Male / Female) using custom radio button sprites (`sprite_94xdf0001.webp`, `sprite_94xdf0002.webp`).
  - Date of Birth segmented inputs (Month / Day / Year) with 18+ age calculation and validation.
  - Green register action button (`normal.webp`, `sprite_1173wq0001.webp`).
  - Inline error messages and loading state during registration.
- **Authentic Logo Integrity (`JitoLogo.tsx`):**
  - Strict preservation of the official target repository logo (`/jito-india-logo.png` featuring the roulette wheel, chip, and cards) instead of reference placeholder text.
- **Zero-Backend Architecture Separation:**
  - Complete decoupling between UI components and API logic.
  - UI components only interact with `services/auth/` contracts (`loginUser`, `registerUser`), which return simulated async promises until real backend endpoints are configured. No fake JWTs or artificial session storage introduced into `localStorage`.

---

## 4. Files Added
- `apps/web/public/assets/auth/backgrounds/BG_login.webp` — Main stage background.
- `apps/web/public/assets/auth/backgrounds/Login_page_pop.webp` — Right-side showcase card background.
- `apps/web/public/assets/auth/cards/login_Page_sup_1.webp` — Login card container frame.
- `apps/web/public/assets/auth/cards/Reg_page_0.webp` — Register modal card container frame.
- `apps/web/public/assets/auth/inputs/login_Page_sup_2.webp` — Login input field texture.
- `apps/web/public/assets/auth/inputs/Reg_and_Login_0.webp` — Register input field texture.
- `apps/web/public/assets/auth/buttons/sprite_220001.webp` — Red submit button (normal).
- `apps/web/public/assets/auth/buttons/sprite_220002.webp` — Red submit button (active/hover).
- `apps/web/public/assets/auth/buttons/normal.webp` — Red register button (normal).
- `apps/web/public/assets/auth/buttons/highlight.webp` — Red register button with higher contrast (hover).
- `apps/web/public/assets/auth/toggles/tickBG.webp` — Checkbox background texture.
- `apps/web/public/assets/auth/toggles/tick.webp` — Checkbox checkmark texture.
- `apps/web/public/assets/auth/toggles/sprite_94xdf0001.webp` — Radio unselected texture.
- `apps/web/public/assets/auth/toggles/sprite_94xdf0002.webp` — Radio selected texture.
- `apps/web/public/assets/auth/badges/18plus.webp` — 18+ statutory badge.
- `apps/web/public/assets/auth/badges/Free_to_play_icon.webp` — Free to play seal.
- `apps/web/public/assets/auth/buttons/Close0001.webp` — Window exit/close button (normal).
- `apps/web/public/assets/auth/buttons/Close0002.webp` — Window exit/close button (hover).
- `apps/web/public/assets/auth/buttons/minimize0001.webp` — Window minimize button (normal).
- `apps/web/public/assets/auth/buttons/minimize0002.webp` — Window minimize button (hover).
- `apps/web/public/assets/auth/fonts/HERMESC_20.otf` — Legacy amusement text font.
- `apps/web/public/assets/auth/fonts/Highway_Gothic_Regular.ttf` — Legacy Remember Me label font.
- `apps/web/src/components/branding/JitoLogo.tsx` — Reusable official branding component.
- `apps/web/src/components/auth/AuthRightPanel.tsx` — Right-side branding and promotional card.
- `apps/web/src/components/auth/LoginForm.tsx` — Complete Login form component.
- `apps/web/src/components/auth/RegisterForm.tsx` — Complete Registration modal form component.
- `apps/web/src/components/auth/AuthStage.tsx` — Responsive 1360×768 letterbox stage wrapper.
- `apps/web/src/services/auth/types.ts` — Authentication domain types and interfaces.
- `apps/web/src/services/auth/login.ts` — Login service contract.
- `apps/web/src/services/auth/register.ts` — Registration service contract.
- `apps/web/src/services/auth/index.ts` — Authentication service barrel export.

---

## 5. Files Modified
- `apps/web/src/app/login/page.tsx`: Replaced temporary login placeholder with `<AuthStage initialScreen="login" />`.
- `apps/web/src/app/register/page.tsx`: Replaced temporary registration placeholder with `<AuthStage initialScreen="register" />`.
- `apps/web/src/components/splash/SplashScreen.tsx`: Updated to use the centralized `JitoLogo` branding component and enforced standard import ordering.

---

## 6. Files Deleted
- `apps/web/public/login/` directory removed (contained obsolete cropped screenshot slices and a duplicate logo file).

---

## 7. Backend Integration Instructions
The authentication UI has been strictly isolated from API implementation. Backend engineers can connect the real backend without modifying any UI components by updating the files in `apps/web/src/services/auth/`:

1. **Login Implementation (`apps/web/src/services/auth/login.ts`):**
   - Replace the simulation delay in `loginUser(credentials: LoginCredentials)` with a fetch or Axios call to the NestJS API endpoint (e.g. `POST /api/v1/auth/login`).
   - Store access tokens in httpOnly cookies or the preferred token store.
   - Return `{ success: true, user: { id, username } }` on success, or `{ success: false, error: '...' }` on failure.

2. **Registration Implementation (`apps/web/src/services/auth/register.ts`):**
   - Replace the simulation delay in `registerUser(data: RegisterData)` with the call to `POST /api/v1/auth/register`.
   - Send `{ username, email, gender, dateOfBirth: ${data.birthYear}-${data.birthMonth}-${data.birthDay} }`.
   - Return `{ success: true, user: { id, username, email } }` or `{ success: false, error: '...' }`.

---

## 8. Testing & Verification
- **Next.js Production Build (`npm run build:web`):**
  - Compiled successfully with 0 errors.
  - Both `/login` (271 B, 96.5 kB first load JS) and `/register` (272 B, 96.5 kB first load JS) prerendered as static pages.
- **Repository Linting (`npm run lint`):**
  - Passed with 0 errors and 0 warnings across all TypeScript files.
- **Repository Type Checking (`npm run typecheck`):**
  - Passed with 0 errors across all monorepo packages and services (`@jito/web`, `@jito/api`, `@jito/game-engine`, `@jito/shared`, `@jito/ui`, `@jito/game-core`).
- **Unit & Integration Tests (`npm test`):**
  - 15 test suites passed, 143 total tests passed.

---

# Migration Log: Lobby Screen — Base Implementation

## 1. Reference
- **Repository:** `pr-project-2-main`
- **Source Layout Specs & Scene Data:**
  - `apps/client/src/unity/level1.layout.json` (`Lobby`, `Header`, `BottomPanel`, and `ButtonPanel` node hierarchies)
  - `apps/client/src/unity/bindings/shell-chrome.tsx` (Lobby and Header component bindings)
  - `apps/client/src/unity/bindings/shell-paths.ts` (Lobby node paths)

---

## 2. Visual Reference
- Attached original lobby screenshot (1360×768 desktop viewport showing active "DRAW GAMES" panel with 3 game cards, top header with player status, and bottom docked category navigation).

---

## 3. Implemented
- **Lobby Background:** Authentic 1360×768 casino environment (`lobbyBg.webp`) with roulette wheel, stars, and red 3D dice.
- **Top Header Bar:**
  - Active red `LOBBY` tab button (`PANNEL_1.webp`).
  - "FOR AMUSEMENT ONLY" notice in `HERMESC_20`.
  - Password management key icon button (`sprite_4040001.webp` / `sprite_4040002.webp`).
  - Welcome box (`DILOUGE_BOX.webp`) displaying `Welcome, {username}`.
  - Dual-tone points balance box (`DILOUGE_BOX1.webp`) displaying `POINTS BALANCE` and `{pointsBalance.toFixed(2)}`.
  - Minimize (`minimize0001.webp`) and Close (`Close0001.webp`) window control buttons.
- **Main Game Panel:**
  - Authentic 1180×593 panel (`SET_2box.webp`) with red border, dark patterned interior, and category header "DRAW GAMES".
- **Game Cards Grid:**
  - `SPIN2WIN PRO TIMER` (`spin2win-card.png`)
  - `TRIPLE CHANCE TIMER` (`triple-chance-card.png`)
  - `TRIPLE CHANCE PRO TIMER` (`triple-chance-pro-card.png`)
  - Interactive hover scaling and focus outlines.
- **Bottom Category Navigation:**
  - 5 docked category tabs (Roulette Games, Draw Games, Slot Games, Table Games, Scratch Games).
  - Active "Draw Games" tab highlighted with raised red border matching the reference screenshot.
  - Interactive click handlers enabling switching between category panels (`SET_1_box.webp` through `SET_5box.webp`).
- **Official Jito India Branding:**
  - Strict preservation of the official repository logo (`/jito-india-logo.png` via `<JitoLogo />`), positioned at `x: 1115px, y: 60px` above the top-right corner of the main panel.

---

## 4. Assets Copied
From `pr-project-2-main/apps/client/public/legacy/ui/` into `apps/web/public/assets/lobby/`:
- `backgrounds/lobbyBg.webp` — 1360×768 authentic lobby casino backdrop.
- `header/Pannel.webp` — 1360×45 top header background.
- `header/PANNEL_1.webp` — Active red header tab button.
- `header/PANNEL_2.webp` — Idle dark header tab button.
- `header/DILOUGE_BOX.webp` — Welcome username container.
- `header/DILOUGE_BOX1.webp` — Points balance dual-tone container.
- `header/sprite_4040001.webp` / `sprite_4040002.webp` — Password change key icon (normal and hover).
- `panels/SET_1_box.webp` — Roulette Games active panel.
- `panels/SET_2box.webp` — Draw Games active panel (primary reference).
- `panels/SET_3box.webp` — Slot Games active panel.
- `panels/SET_4box.webp` — Table Games active panel.
- `panels/SET_5box.webp` — Scratch Games active panel.
- `fonts/HERMESC.otf` — Legacy amusement and category header font.
- `fonts/GOTHIC.ttf` — Legacy Lobby tab font.

---

## 5. Assets Reused
From `jito-india-game`:
- `apps/web/public/jito-india-logo.png` — Official Jito India Games logo.
- `apps/web/public/lobby/spin2win-card.png` — Spin2Win Pro Timer card thumbnail.
- `apps/web/public/lobby/triple-chance-card.png` — Triple Chance Timer card thumbnail.
- `apps/web/public/lobby/triple-chance-pro-card.png` — Triple Chance Pro Timer card thumbnail.
- `apps/web/public/assets/auth/buttons/minimize0001.webp` — Minimize window button.
- `apps/web/public/assets/auth/buttons/Close0001.webp` — Close window button.

---

## 6. Files Created
- `apps/web/src/components/lobby/LobbyStage.tsx` — Fixed 1360×768 letterbox responsive stage wrapper.
- `apps/web/src/components/lobby/LobbyHeader.tsx` — Top application header bar with user/balance controls.
- `apps/web/src/components/lobby/LobbyMainPanel.tsx` — Main panel container with category dock and game grid.
- `apps/web/src/components/lobby/GameCard.tsx` — Individual game card component with hover feedback.
- `apps/web/src/app/lobby/page.tsx` — Next.js App Router page for `/lobby`.

---

## 7. Files Modified
- `apps/web/src/app/games/page.tsx`: Updated to render `<LobbyStage />` so `/games` displays the authentic base lobby interface.
- `apps/web/src/app/globals.css`: Registered `@font-face` definitions for `HERMESC` and `Century Gothic`.
- `docs/migration-log.md`: Appended this base lobby implementation documentation.

---

## 8. Files Deleted
- None. No assets or files were removed for this migration.

---

## 9. Backend Placeholders
The lobby is purely a frontend base UI implementation without any backend or mock APIs:
- `username`: Static default `"PINTU"`, parameterized as a prop on `<LobbyStage initialUsername={...} />`.
- `pointsBalance`: Static default `62933.00`, parameterized as a prop on `<LobbyStage initialBalance={...} />`.
- `game cards`: Clicking games routes to existing game routes (`/games/triple-chance`, `/games/triple-chance-pro`) without mock session or game engine APIs.

---

## 10. Routing
- Added `/lobby` (`apps/web/src/app/lobby/page.tsx`).
- Maintained `/games` (`apps/web/src/app/games/page.tsx`), mounting `<LobbyStage />`.
- Zero existing routes (`/`, `/login`, `/register`, `/splash`, `/download`, `/games/*`) were deleted, renamed, or restructured.

---

## 11. Testing & Verification
- **Next.js Production Build (`npm run build:web`):**
  - Exit code 0.
  - Successfully compiled and prerendered 12 static pages including `/lobby` (253 B) and `/games` (253 B).
- **Repository Linting (`npm run lint`):**
  - Passed with 0 errors and 0 warnings.
- **Repository Typecheck (`npm run typecheck`):**
  - Passed across all monorepo packages (`@jito/web`, `@jito/api`, `@jito/game-engine`, `@jito/shared`, `@jito/ui`, `@jito/game-core`).
- **Unit & Integration Tests (`npm test`):**
  - 15 test suites passed, 143 total tests passed.

---

## Change Password — Reference Migration

### Reference
`pr-project-2-main`

### Trigger
The green square button with a silver/white key icon located in the top header bar (`sprite_4040001.webp` / `sprite_4040002.webp`).

### Reference Implementation
- **Icon / Trigger:**
  - Layout: `Canvas/FrontPanels/Header/PlayerData/ChangePassword` in `apps/client/src/unity/level1.layout.json`.
  - Binding: `apps/client/src/unity/bindings/shell-chrome.tsx` (opens Change Password dialog via `ctx.openChangePassword()`).
- **Modal Component & Dialog Layout:**
  - Layout: `Canvas/PasswordDialog` in `apps/client/src/unity/level1.layout.json`.
  - Dimensions: 400×390 px modal box frame (`ui/Bg.png` / `Bg.webp`) centered within the 1360×768 canvas.
  - Backdrop: Fullscreen semi-transparent overlay with color `rgba(0, 0, 0, 0.516)`.
  - Input fields: 220×30 px with texture `ui/InputFieldBackground.png` / `InputFieldBackground.webp`:
    - Old Password (`OldPassField`): center at `y: +72.5`, placeholder `"Enter Old Password..."`
    - New Password (`NewPassField`): center at `y: +2.5`, placeholder `"Enter New Password"`
    - Confirm Password (`ConfirmPassField`): center at `y: -70.0`, placeholder `"Confirm New Password"`
  - Action buttons: 133×33 px positioned at `y: -152.0`:
    - Change Button (`ChangeBtn`): normal `ui/BTN0001.png`, hover/pressed `ui/BTN0002.png`
    - Cancel Button (`CancelBtn`): normal `ui/wedcsdsd0001.png`, hover/pressed `ui/wedcsdsd0002.png`
- **Form State & Validation:**
  - Handled in `apps/client/src/unity/useShellSession.ts` (lines 106–120) and `shell-auth.tsx`.
  - Client checks: All fields required, `newPassword === confirmPassword`, minimum length 6 characters.
- **Reference API Behavior:**
  - Contract: `POST /me/password`, body: `{ current: string, next: string }`, headers: `Authorization: Bearer <token>`.
  - Responses: `204 No Content` on success; `400 'Passwords do not match'`; `400 'Check Current password!'`; `400 'Password must be at least 6 characters'`.

### Target Implementation
- **New Component:** `apps/web/src/components/lobby/ChangePasswordModal.tsx`
  - Recreates the exact 400×390 dialog centered on the 1360×768 stage.
  - Sits on top of the lobby canvas with backdrop `rgba(0, 0, 0, 0.516)`.
  - Controlled inputs for Old Password, New Password, and Confirm Password with auto-focus on open and Escape-to-close handler.
  - Submit and cancel buttons with interactive sprite state swapping (`BTN0001` → `BTN0002`, `wedcsdsd0001` → `wedcsdsd0002`).
  - In-dialog status text banner using `HERMESC_20` typography.
- **Service Integration Point:** `apps/web/src/services/auth/changePassword.ts`
  - Clean TypeScript function `changePassword(data: ChangePasswordData): Promise<AuthResult>`.
  - Performs client-side validation (presence, mismatch, length >= 6).
  - Simulates 350ms dispatch delay for realistic UI feedback.
  - Clear integration status: `PENDING IMPLEMENTATION`.
- **Lobby Integration:** `apps/web/src/components/lobby/LobbyStage.tsx`
  - Maintains `isChangePasswordOpen` state.
  - Passes `onChangePassword={() => setIsChangePasswordOpen(true)}` to `LobbyHeader`.
  - Renders `<ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />`.

### Reference → Next.js Adaptations
- In `pr-project-2-main`, the UI was rendered via an in-house JSON layout interpreter (`UnityView` / `NodePatch`).
- In `jito-india-game`, the dialog is implemented as an authentic React component (`ChangePasswordModal.tsx`) using Next.js client component conventions (`'use client'`).
- Sits cleanly within the 1360×768 letterbox coordinate space, automatically scaling seamlessly across any viewport without distortion.

### Backend Status
> The backend currently has no implemented Change Password API. The frontend has been structured with a dedicated authentication service/integration point (`apps/web/src/services/auth/changePassword.ts`) so the backend implementation can be connected later without rewriting the UI.

### Files Created
- `apps/web/src/components/lobby/ChangePasswordModal.tsx` — Modal dialog component matching reference layout and assets.
- `apps/web/src/services/auth/changePassword.ts` — Authentication service integration point for changing password.

### Files Modified
- `apps/web/src/components/lobby/LobbyStage.tsx` — Added modal open/close state and rendered `ChangePasswordModal`.
- `apps/web/src/services/auth/types.ts` — Added `ChangePasswordData` interface definition.
- `apps/web/src/services/auth/index.ts` — Exported `changePassword.ts`.
- `docs/migration-log.md` — Appended Change Password reference migration documentation.

### Files Deleted
- None.

### Assets Copied
Copied from `pr-project-2-main/apps/client/public/legacy/ui/` into `apps/web/public/assets/lobby/dialogs/`:
- `Bg.webp` (400×390 modal dialog frame with title and labels)
- `BTN0001.webp` (Change button normal state)
- `BTN0002.webp` (Change button hover/pressed state)
- `wedcsdsd0001.webp` (Cancel button normal state)
- `wedcsdsd0002.webp` (Cancel button hover/pressed state)
- `InputFieldBackground.webp` (Input field texture)

### Dependencies
- None added or removed.

---

# Migration Log: Main Game UI Migration (Triple Chance Timer & Triple Chance Pro Timer)

## 1. Reference
- **Repository:** `pr-project-2-main`
- **Source Artifacts & Layout Specs:**
  - `apps/client/src/unity/gametc.layout.json` (canonical 1360×768 layout tree compiled from customer asset bundle `tc1`)
  - `apps/client/public/legacy/tc/*` (223 authentic game textures and UI sprites)
  - `apps/client/src/unity/GameTCView.tsx` (screen composition and state coordination)
  - `apps/client/src/unity/bindings/boards.tsx` (doubles 10×10 grid, triples range tabs 000–900 with 10×10 grid, singles 0–9 bar)
  - `apps/client/src/unity/bindings/wheel.ts` (3 concentric rotating rings: outer, middle, inner with crown reveal marker)
  - `apps/client/src/unity/bindings/controls.ts` (chips tray, 12 fps animated blinker, action buttons DOUBLE / REPEAT / INFO / CLEAR)
  - `apps/client/src/unity/info/*` (5-tab authentic game rules and statement modal: Rules, PaySlip, History, Result, Report)

---

## 2. Target
- **Repository:** `jito-india-game`
- **Application:** `apps/web` (Next.js 14 App Router)
- **Routes:**
  - `/games/triple-chance` (Triple Chance Timer)
  - `/games/triple-chance-pro` (Triple Chance Pro Timer)

---

## 3. What Was Migrated
- **1360×768 Responsive Stage & Header:** Created `GameTCStage.tsx` matching `LobbyStage` letterbox scaling matrix (`Math.min(vw / 1360, vh / 768)`). Includes authentic 45px top header with inactive `LOBBY` tab (`PANNEL_2.webp`) for returning to `/lobby`, active game tab (`PANNEL_1.webp`) with close button (`×`), "FOR AMUSEMENT ONLY" label, password change key icon (`sprite_4040001.webp` / `sprite_4040002.webp`), player greeting box, and points balance dual-tone box.
- **Concentric 3-Ring Animated Wheel (`WheelContainer.tsx`):** Outer ring (clockwise), middle ring (counter-clockwise), and inner ring (clockwise) using original sprites `Wheel_1.webp`, `Wheel_2.webp`, `Wheel_3.webp`, overlaid with ornate bezel `FRAME_1.webp`, golden crown indicator `ghn.webp`, countdown timer display with "SEC LEFT" badge, and center orb (`1_1.webp`).
- **Doubles Board Grid (`DoubleBoard.tsx`):** 10×10 checkered grid (00–99) alternating pink (`cell_0.webp`) and green (`cell_1.webp`) tiles, staked state indicator (`51X510003.webp`), row/column bulk selection arrows (`arrow_up0001.webp` / `arrow_0001.webp`), and random pick buttons (5, 10, 15, 20, 25, 50, 75).
- **Triples Board Grid (`TripleBoard.tsx`):** 10 range tabs (`000`–`900`) using `tab1_0001.webp` / `tab1_0002.webp`, active 10×10 numbered grid (`000`–`999`), row/column bulk selection arrows, and random pick buttons (5, 10, 15, 20, 25, 50, 75, 100).
- **Singles Bar (`SingleBoard.tsx`):** 10 horizontal cells (0–9) positioned atop `Pixel_holder_Game2.webp` with authentic staked chip markers.
- **Chip Tray & Animated Blinker (`ChipTray.tsx`):** 9 authentic chip sprites (2, 5, 10, 20, 30, 40, 50, 100, 500) with selection halo indicator (`circle.webp`), and 12 fps animated status lamp (`dfgd0001` through `dfgd0010`) cycling beside live status message text (`Place your chips`, `Last Chance`, `No More Play`).
- **Scoreboard & Points Strip (`ScoreboardPanel.tsx`):** Previous 6 draw history results (triple, double, single digits) housed on `scoreboard.webp`, alongside PLAY and WIN point display counters atop `playwin.webp`.
- **Action Control Bar (`ActionBar.tsx`):** DOUBLE (`double0001`–`0003`), REPEAT (`Repeat0001`–`0003`), INFO (`info0001`–`0003`), and CLEAR (`clear0001`–`0003`) buttons with realistic normal, hover, pressed, and disabled sprite states.
- **Game Info Modal (`GameInfoModal.tsx`):** 5-tab authentic popup dialogue supporting Rules (`RulesNew_2.webp`), PaySlip, History, Result (with date picker and draw table), and Report views.
- **State & Action Coordination (`GameTCView.tsx`):** Full game table composition handling chip placement, right-click removal, row/col bulk staking, random selection, doubling, re-betting, and balance calculation.

---

## 4. Backend Game Logic Status & Architectural Integration
> **CRITICAL ARCHITECTURAL BOUNDARY:** No fake backend APIs, fake WebSockets, fake auth tokens, or mock server engines were introduced.
- In accordance with project instructions, all backend interaction points are cleanly isolated behind `apps/web/src/services/game/`:
  - `gameService.ts`: Exports `placeBet`, `subscribeToGame`, and `fetchDrawHistory` with clear `PENDING IMPLEMENTATION` documentation.
  - `mockGameState.ts`: Centralizes initial round state (`739TC357`, 90-second countdown, recent 6 draw history entries) without polluting UI components.
  - `types.ts`: Strictly defines domain models (`GameState`, `BetType`, `GameCode`, `DrawResult`, `HistoryRow`).

---

## 5. Files Added
- `apps/web/public/assets/tc/*` — 223 authentic game textures and UI sprites (2.66 MB).
- `apps/web/src/services/game/types.ts` — Game models, bet types, and draw history contracts.
- `apps/web/src/services/game/mockGameState.ts` — Initial mock round data and draw history.
- `apps/web/src/services/game/gameService.ts` — Frontend-to-backend service integration point.
- `apps/web/src/services/game/index.ts` — Game service export barrel.
- `apps/web/src/components/game/WheelContainer.tsx` — Concentric 3-ring wheel and countdown timer.
- `apps/web/src/components/game/DoubleBoard.tsx` — 10×10 doubles grid with quick selection controls.
- `apps/web/src/components/game/TripleBoard.tsx` — 000–900 triples tabs and 10×10 grid.
- `apps/web/src/components/game/SingleBoard.tsx` — Bottom singles 0–9 betting strip.
- `apps/web/src/components/game/ChipTray.tsx` — Denomination chips and 12 fps status blinker lamp.
- `apps/web/src/components/game/ScoreboardPanel.tsx` — History scoreboard and Play/Win displays.
- `apps/web/src/components/game/ActionBar.tsx` — DOUBLE, REPEAT, INFO, CLEAR action controls.
- `apps/web/src/components/game/GameInfoModal.tsx` — 5-tab modal dialog for rules and reports.
- `apps/web/src/components/game/GameTCView.tsx` — Main game table composition and interaction wiring.
- `apps/web/src/components/game/GameTCStage.tsx` — 1360×768 responsive container with authentic header.

---

## 6. Files Modified
- `apps/web/src/app/games/triple-chance/page.tsx` — Replaced mockup with authentic `<GameTCStage code="TCT" />`.
- `apps/web/src/app/games/triple-chance-pro/page.tsx` — Replaced mockup with authentic `<GameTCStage code="TCPT" />`.
- `apps/web/src/app/globals.css` — Appended `@keyframes u-win-pulse` and `.u-win-highlight`.
- `docs/migration-log.md` — Documented Main Game UI migration.

---

## 7. Verification & Build
- `npm run typecheck`: Passed with 0 errors across all monorepo workspaces.
- `npx tsc --noEmit --project apps/web/tsconfig.json`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors, 0 warnings.
- `npm test`: 15 test suites passed, 143 tests passed.
- `npm run build:web`: Next.js production build succeeded; generated all 12 static routes.

---

# Visual Refinements from Active & Win State References

## 1. Reference Sources
- `assets/reference/triple-chance-timer/triple-chance-active-state-reference.jpg`
- `assets/reference/triple-chance-timer/triple-chance-win-state-reference.jpg`

## 2. Refinements Implemented
- **Action Buttons (`ActionBar.tsx`):**
  - Expanded button dimensions to **150px width × 70px height** (grid 2×2 within 330×165px panel, 12px column gap, 9px row gap).
  - Authentic typography: 20px bold dark green font (`#0a420a`) with white embossed text shadow `0 1px 1px rgba(255, 255, 255, 0.85)` matching `Btn1.webp`.
  - Disabled state: `disable.webp` with muted grey lettering.
- **Doubles Board (`DoubleBoard.tsx`):**
  - Text color aligned to **bold black digits (`#000000`)** at 18px font size, matching the reference images.
  - Added centered `DOUBLES` green pill badge with gold border in the upper baroque arch.
  - Aligned column selection arrows top/bottom (`ARROW_UP.webp`) and row selection arrows left/right (`RightGlow.webp` / `LeftGlow.webp`).
  - Positioned circular pink quick-pick tokens (`5, 10, 15, 20, 25, 50, 75`) on the left, followed by the `RANDOM PICK` golden text on the right.
- **Triples Board (`TripleBoard.tsx`):**
  - Added centered `TRIPLES` green pill badge with gold border in the upper arch.
  - Active tab highlighted in vibrant lime-green (`#22c55e`), inactive tabs in rich amber (`#f59e0b`).
  - Text color aligned to **bold black digits (`#000000`)** at 15px font size.
  - `RANDOM PICK` golden label positioned on the left, followed by circular pink tokens (`5, 10, 15, 20, 25, 50, 100`).
- **Wheel Container & Timer (`WheelContainer.tsx`):**
  - `Seconds left` rendered in bright red cursive script on top, with large golden-yellow bold countdown digits (48px, `#FDD835`) beneath it.
  - In win state (`phase === 'RESULT'`): winning 3-digit number (e.g. `772`) displayed inside the central 3D orb in bold white font with dark gold outline, accompanied by the animated jewel pointer frame (`sprite_8270001.webp`) at 12 o'clock.
- **Singles Bar (`SingleBoard.tsx`):**
  - Added centered `SINGLES` green pill badge above the bar.
  - Cells enlarged to full 53×53px with bold black digits (`#000000`) at 24px font size.
- **Chip Tray (`ChipTray.tsx`):**
  - Golden oval holder (`Chip_holder_2.webp`) houses 8 denomination chips (`2, 5, 10, 20, 30, 40, 50, 100`) centered at 46×46px each.
  - Red status message bar sits below the tray displaying `Place your chips` in bold white font with the 12 fps status lamp blinker.
- **Scoreboard & Play/Win (`ScoreboardPanel.tsx`):**
  - Clearly separated row labels (`Triple`, `Double`, `Single`) from the 6 history result columns.
  - Most recent draw highlighted in the first column with dark brown/black typography.
  - `PLAY :` and `WIN :` values formatted with bold black and bright green text.
- **Header (`GameTCStage.tsx`):**
  - Red active tab with white text `Triple Chance Timer` and close `×` button.
  - Green minimize button (`-`) and red close button (`×`) matching the authentic desktop client styling.

---

## Main Game UI — Visual Refinement

### Reference
`pr-project-2` (`gametc.layout.json`, `apps/client/src/unity/*`, extracted texture atlas)

### Visual reference
Attached original game screenshots (`triple-chance-active-state-reference.jpg` and `triple-chance-win-state-reference.jpg`).

### Objective
The existing game UI was comprehensively refined to reproduce the authentic visual appearance of the original game with pixel-level alignment, exact canonical coordinate geometry, authentic asset layering, and proper visual states.

### Changes made
1. **Coordinate Realignment & Full 1360×768 Canvas:**
   - Identified that `GameTCView` had an arbitrary `top: 45px` offset that was displacing all game elements downwards.
   - Refactored `GameTCView` to anchor across the complete `1360×768` stage (`top: 0, left: 0`), allowing all canonical Unity coordinates (`gametc.layout.json`) to map directly without manual compensation.
   - Reset stage canvas backdrop to `1360×768` at `0 0` with `backgroundSize: '100% 100%'`.
2. **Top Header Refinement (`GameTCStage.tsx`):**
   - Active game tab upgraded from a generic CSS gradient to authentic `PANNEL_1.webp`.
   - Inactive `LOBBY` tab styled with `PANNEL_2.webp`.
   - Migrated and integrated the authentic `tabclose.webp` close button sprite on the active tab.
   - Window controls use `minimize0001.webp` and `Close0001.webp`.
   - Centered `GAME ID` badge (`GAME_ID.webp`) positioned at `{ x: 134.5, y: 43.5, w: 177, h: 28.5 }` with vibrant green font.
3. **Doubles Board (`DoubleBoard.tsx`):**
   - Positioned ornate frame `sectionpanel.webp` at `{ left: -8.5px, top: 26.7px, width: 512px, height: 590px }`.
   - Removed redundant CSS `DOUBLES` pill badge that was covering the authentic artwork header.
   - Positioned 10×10 grid at `{ left: 15.75px, top: 120px, width: 425px, height: 425px }` with authentic `51X510001.webp` (green) and `51X510002.webp` (pink) checkerboard cells.
   - Staked cells display `51X510003.webp` with bold black stake values on the gold dome.
   - Positioned 10 row selection arrows (`RightGlow.webp`) at `x: 0, y: 129` with 42.3px pitch.
   - Positioned 10 column selection arrows (`ARROW_UP.webp`) at `x: 21.25, y: 542` with 42.1px pitch.
   - Random pick bar aligned with authentic pink gem tokens (`05.webp`) and `Random_Select.webp` label on the right.
4. **Triples Board (`TripleBoard.tsx`):**
   - Positioned frame `triplepanel.webp` at `{ left: -7.75px, top: 28.3px, width: 513px, height: 586px }` (relative to `RightSection` at `x: 870`).
   - Removed redundant CSS `TRIPLES` pill badge that was covering the authentic artwork header.
   - Replaced CSS gradient tabs with authentic textures: `topline0004.webp` (gold active), `topline0003.webp` (green with bets), and `topline0002.webp` (amber normal).
   - Positioned 10×10 grid at `{ left: 47.5px, top: 120px, width: 425px, height: 425px }`.
   - Positioned 10 row selection arrows (`LeftGlow.webp`) at `x: 470.5, y: 127.8`.
   - Positioned 10 column selection arrows (`ARROW_UP.webp`) at `x: 59.75, y: 542.5`.
   - Random pick bar placed with `Random_Select.webp` on the left and pink gem tokens on the right.
5. **Concentric 3-Ring Wheel & Timer (`WheelContainer.tsx`):**
   - "Seconds left" script header uses authentic `sec.webp` asset.
   - Countdown timer digits in bold golden-yellow (`#FDD835`) during active state, switching to bold red `00` in win state.
   - Positioned crown indicator (`ghn.webp`) at 12 o'clock above wheel bezel frame (`FRAME_1.webp`).
   - Rings (`Wheel_1.webp`, `Wheel_2.webp`, `Wheel_3.webp`) and center orb (`Wheel_Middel.webp`) centered with canonical dimensions.
   - Win state renders the jeweled pointer frame (`sprite_8270001.webp`) over individual ring highlights (`Third_WIN_HIGHLight0001.webp`, `Mid_WIN_HIGHLight0001.webp`, `Single_WIN_HIGHLight0001.webp`) with winning digits, and displays winning 3-digit total in the center orb.
6. **Singles Bar (`SingleBoard.tsx`):**
   - Positioned `Pixel_holder_Game2.webp` at `{ left: 372.5px, top: 511.5px, width: 615px, height: 148px }`.
   - Removed duplicate CSS `SINGLES` pill badge, revealing the embedded badge in the artwork.
   - 10 cells (0..9) aligned inside the golden bezel at `{ left: 42.5px, top: 56.8px, width: 530px, height: 53px }`.
   - Added speech bubble popup (`Pop_Pixel_Icon.webp`) displaying `No: / Play: / WIN` on winning single cells during the win state.
7. **Chip Tray (`ChipTray.tsx`):**
   - Positioned `Chip_holder_2.webp` at `{ left: 330px, top: 652.5px, width: 700px, height: 118px }`.
   - Corrected selection halo: Moved `circle.webp` behind the chip (`zIndex: 1`) so denomination values remain sharp and visible without white blob obstruction.
   - Integrated 12 fps animated blinker lamp (`dfgd0001`..`dfgd0010`) and status text banner in bottom red trapezoid.
8. **Scoreboard & Totals (`ScoreboardPanel.tsx`):**
   - Positioned `scoreboard.webp` and `playwin.webp` at canonical coordinates.
   - Newest draw column highlighted with `SDT_Pannel_HighLight.webp`.
   - Aligned `PLAY :` and neon-green `WIN :` readouts.
9. **Action Buttons (`ActionBar.tsx`):**
   - 2×2 button grid aligned at `{ left: 1030px, top: 603px }`.
   - Disabled states use `disable.webp` with muted olive-green lettering; active states use `Btn1.webp` with embossed dark-green lettering.

### Assets migrated
From `pr-project-2`:
- `apps/web/public/assets/lobby/header/tabclose.webp` — Close button on active header tab.

### Assets reused from target
- `apps/web/public/assets/tc/BG.webp` — Velvet curtain backdrop.
- `apps/web/public/assets/tc/sectionpanel.webp` — Doubles baroque frame.
- `apps/web/public/assets/tc/triplepanel.webp` — Triples baroque frame.
- `apps/web/public/assets/tc/Pixel_holder_Game2.webp` — Singles frame.
- `apps/web/public/assets/tc/Chip_holder_2.webp` — Chip tray frame.
- `apps/web/public/assets/tc/scoreboard.webp` — Scoreboard history frame.
- `apps/web/public/assets/tc/playwin.webp` — Play/Win counters frame.
- `apps/web/public/assets/tc/SDT_Pannel_HighLight.webp` — History column highlight.
- `apps/web/public/assets/tc/GAME_ID.webp` — Game ID pill frame.
- `apps/web/public/assets/tc/sec.webp` — "Seconds left" script header.
- `apps/web/public/assets/tc/ghn.webp` — Crown marker.
- `apps/web/public/assets/tc/FRAME_1.webp` — Wheel bezel.
- `apps/web/public/assets/tc/Wheel_1.webp`, `Wheel_2.webp`, `Wheel_3.webp`, `Wheel_Middel.webp`, `Wheel_Ring.webp` — Wheel concentric rings and center orb.
- `apps/web/public/assets/tc/sprite_8270001.webp` — Diamond win pointer frame.
- `apps/web/public/assets/tc/Third_WIN_HIGHLight0001.webp`, `Mid_WIN_HIGHLight0001.webp`, `Single_WIN_HIGHLight0001.webp` — Winning ring segment highlights.
- `apps/web/public/assets/tc/51X510001.webp`, `51X510002.webp`, `51X510003.webp`, `ICON0003.webp` — Board cells, staked dome, and win badges.
- `apps/web/public/assets/tc/05.webp`, `Random_Select.webp` — Random pick tokens and gold label.
- `apps/web/public/assets/tc/Btn1.webp`, `disable.webp` — Action button textures.
- `apps/web/public/assets/tc/Pop_Pixel_Icon.webp` — Winner speech bubble.
- `apps/web/public/assets/tc/topline0002.webp`, `topline0003.webp`, `topline0004.webp` — Triples tabs.
- `apps/web/public/assets/lobby/header/PANNEL_1.webp`, `PANNEL_2.webp`, `Pannel.webp` — Header tabs and background.
- `apps/web/public/assets/auth/buttons/minimize0001.webp`, `Close0001.webp` — Window control buttons.

### Files modified
- `apps/web/src/components/game/GameTCStage.tsx` — Full 1360×768 background at 0, 0, PANNEL_1.webp active tab, tabclose.webp integration.
- `apps/web/src/components/game/GameTCView.tsx` — Anchored to 1360×768, eliminated artificial 45px offset, passed canonical coordinates and win highlight states.
- `apps/web/src/components/game/DoubleBoard.tsx` — Exact coordinates, removed duplicate CSS DOUBLES badge, aligned arrows and random pick.
- `apps/web/src/components/game/TripleBoard.tsx` — Exact coordinates, removed duplicate CSS TRIPLES badge, integrated authentic topline tabs.
- `apps/web/src/components/game/WheelContainer.tsx` — sec.webp script header, exact canonical wheel and crown positions, 12 o'clock jeweled win highlighter.
- `apps/web/src/components/game/SingleBoard.tsx` — Exact coordinates, removed duplicate CSS SINGLES badge, added Pop_Pixel_Icon.webp win bubble.
- `apps/web/src/components/game/ChipTray.tsx` — Re-layered selection halo behind chip face, aligned status message and 12 fps blinker lamp.
- `apps/web/src/components/game/ActionBar.tsx` — Canonical 2×2 button placement, Btn1.webp and disable.webp textures, HERMESC typography.
- `apps/web/src/components/game/ScoreboardPanel.tsx` — Canonical coordinates, SDT_Pannel_HighLight.webp integration, PLAY and WIN alignment.
- `apps/web/src/services/game/mockGameState.ts` — Updated default mock state to match reference round and history.

### Files created
- `apps/web/public/assets/lobby/header/tabclose.webp` — Active tab close button.

### Files deleted
- None.

### Reference → Target adaptations
- In `pr-project-2`, the UI was rendered via an in-house JSON layout interpreter (`UnityView`). In `jito-india-game`, the game screen is implemented using clean, modular Next.js React client components with pure CSS layout, preserving the exact geometric coordinates and visual textures.

### Backend considerations
- Bet placement, chip selection, clearing, doubling, and repeating remain functional client-side with clean boundaries in `apps/web/src/services/game/gameService.ts` ready for real WebSocket/REST endpoints.

### Testing & Verification
- `npm run typecheck`: Passed with 0 errors across all monorepo workspaces.
- `npx tsc --noEmit --project apps/web/tsconfig.json`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors and 0 warnings.
- `npm test`: 15 test suites passed, 143 total tests passed.
- `npm run build:web`: Next.js production build succeeded; generated all 12 static routes.
- Dual-State Visual Parity Verified:
  - **Active Betting State (`/games/triple-chance`):** Countdown in gold (`37`), clean table, chip 2 selected with halo behind chip face, history starting with `751`, status `Place your chips`, points balance `167249.00`.
  - **Win State (`/games/triple-chance?state=win`):** Countdown in red (`00`), center orb bold black `131`, 12 o'clock pointer with outer `1`, mid `3`, inner `1`, Doubles staked bets on 04, 06, 36, 51, 53 with golden dome stakes, starburst badge on Doubles 31 and Triples 131, Singles cell 1 with starburst badge and `Pop_Pixel_Icon.webp` popup (`No: 1 / Play: 2 / WIN 18`), scoreboard starting with `131 / 31 / 1`, `PLAY : 56`, `WIN : 18`, points balance `167193.00`, status `YOU WIN`.
  - Seamless instant toggle supported via URL parameter (`?state=win` / `?state=betting`), clicking `FOR AMUSEMENT ONLY` or `GAME ID`, or pressing `W` / `B` hotkeys.




