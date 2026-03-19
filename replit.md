# RingLock

A cyberpunk-themed arcade ring-timing game built with React Native / Expo. Players tap at the exact moment a shrinking ring matches the target ring.

## Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81.5) with Expo Router for file-based navigation
- **Language**: TypeScript
- **Platform**: Mobile (iOS/Android) + Web via React Native Web
- **Font**: Orbitron (Google Font — 400, 700, 900 weights)
- **Audio**: expo-av for sound effects
- **Storage**: AsyncStorage for local/offline persistence
- **Architecture**: Frontend-only (offline mode, no backend)
- **Packages**: expo-haptics, react-native-reanimated, expo-store-review

## Project Structure

```
app/
  _layout.tsx           # Root layout: ErrorBoundary > SettingsProvider > ThemeProvider > GestureHandler
  index.tsx             # Main game screen (all overlays wired here)
components/
  AchievementsOverlay.tsx
  AchievementToast.tsx
  DailyChallengeOverlay.tsx   # Daily challenge + streak display
  ErrorBoundary.tsx / ErrorFallback.tsx
  GameOverOverlay.tsx         # Enhanced with YENİ REKOR gold badge
  GridBackground.tsx
  MainMenu.tsx                # 5 icon buttons: Başarımlar, Skorlar, Temalar, Görev, Ayarlar
  ModeSelect.tsx
  ParticleEffect.tsx          # Neon particles on PERFECT hit
  ScoresOverlay.tsx
  SettingsOverlay.tsx
  TargetRings.tsx             # RingsAnchor accepts ringColor prop for theme
  ThemeOverlay.tsx            # Ring color + background theme picker with unlock system
  TutorialOverlay.tsx         # 3-step first-launch tutorial
hooks/
  useGameLoop.ts              # Core game loop; calls streak, daily challenge, rate review on gameover
lib/
  achievements.ts             # Achievement definitions and unlock logic
  dailyChallenge.ts           # Date-seeded daily challenge generation and tracking
  rateReview.ts               # expo-store-review prompt (after 5+ games, 30-day cooldown)
  SettingsContext.tsx          # Sound + vibration settings; resetAllData
  sounds.ts                   # Sound manager
  streak.ts                   # Consecutive-day play tracking
  ThemeContext.tsx             # 6 ring themes + 5 bg themes with unlock conditions
assets/                       # Images and audio files
patches/                      # patch-package patches for expo-asset
```

## AsyncStorage Keys

- `ringlock_settings` — sound/vibration settings
- `ringlock_best` — classic mode best score
- `ringlock_best_hardcore/zen/speed` — per-mode best scores
- `ringlock_achievements` — array of unlocked achievement IDs
- `ringlock_total_games` — lifetime game count
- `ringlock_total_score` — lifetime total score
- `ringlock_tutorial_done` — boolean, tutorial shown flag
- `ringlock_theme` — active ring + bg theme IDs
- `ringlock_streak` — current day streak count
- `ringlock_last_play_date` — YYYY-MM-DD of last play
- `ringlock_last_review_date` — YYYY-MM-DD of last store review
- `ringlock_daily_YYYY-MM-DD` — daily challenge completion data

## Game Modes

- **Classic**: 3 lives, progressive difficulty
- **Hardcore**: 1 life, faster rings
- **Zen**: No lives, practice mode
- **Speed Rush**: 60-second timed mode

## Phases Implemented

### Phase 1 — Settings & Data
- Version display in Settings
- "VERİLERİ SIFIRLA" button with confirmation
- `resetAllData()` in SettingsContext

### Phase 2 — Visual Polish
- 600ms fade-in after splash screen
- 3-step tutorial overlay (first launch, AsyncStorage-persisted)
- Neon particle burst on PERFECT hit
- Screen shake animation on miss
- Animated gold "YENİ REKOR" badge in GameOverOverlay

### Phase 5 — New Game Modes
- Mirror Mode ("AYNA"): ring grows 0→MAX_R instead of shrinking; miss when it overshoots; unlocks at 10+ best score
- Dual Mode ("İKİZ"): 2 rings simultaneously at different positions/speeds (ring2 = 80% speed); tap evaluates both; both-hit grants +2 score; unlocks at 25+ best score
- ModeSelect rewritten: ScrollView layout, AsyncStorage unlock check, locked modes show 🔒 + unlock hint
- ScoresOverlay updated: AYNA + İKİZ rows added to per-mode best scores section
- GameMode type extended: mirror | dual; GAME_MODES record extended with isMirror/isDual/unlockScore flags
- useGameLoop: ringRadius2/anchorX2/anchorY2/targetScale2/targetColor2 shared values; dualMissedRef prevents double auto-miss; handleDualAutoMiss; handleScreenTap dual branch; spawnRing handles both mirror+dual
- app/index.tsx: second RingsAnchor rendered when isDualMode; new shared values destructured

### Phase 4 — Stats & Accessibility
- ScoresOverlay rewritten: mode best scores + 6-card lifetime stat grid (games, total score, avg score, best combo, streak, daily challenges)
- All-time best combo tracking (ringlock_best_combo)
- Daily challenge completion counter (ringlock_daily_completed_count)
- SettingsContext extended with largeText + highContrast booleans
- SettingsOverlay: new "ERİŞİLEBİLİRLİK" section with 2 toggles + sublabels, scrollable layout
- largeText: score 44→58px, hit label 28→40px, combo 32→42px
- highContrast: score text turns white, hit label full opacity, shrinking ring border 2.5→4px

### Phase 3 — Engagement Systems
- 6 ring color themes + 5 background themes with unlock conditions
- ThemeOverlay with lock/unlock preview grid
- Date-seeded daily challenge (score/combo/perfect types)
- Consecutive-day streak tracking with milestone display
- DailyChallengeOverlay showing streak + today's challenge
- Rate & Review prompt (expo-store-review, after 5+ games, 30-day cooldown)
- Streak + daily challenge checked automatically after each game

## Running the App

- **Workflow**: "Start application" runs `npx expo start --web --port 5000 --host lan`
- **Web Preview**: Available on port 5000
- **Mobile**: Scan QR code with Expo Go app

## Deployment

- **Target**: Static site (Expo web export)
- **Build Command**: `npx expo export --platform web --output-dir dist`
- **Public Dir**: `dist`
