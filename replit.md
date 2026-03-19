# RingLock

A React Native / Expo mobile game called RingLock. Players interact with ring-based lock puzzles.

## Tech Stack

- **Framework**: Expo (React Native) with Expo Router for file-based navigation
- **Language**: TypeScript
- **Platform**: Mobile (iOS/Android) + Web via React Native Web
- **Font**: Orbitron (custom Google Font loaded via expo-font)
- **Audio**: expo-av for sound effects
- **Storage**: AsyncStorage for local/offline persistence
- **Architecture**: Frontend-only (offline mode, no backend)

## Project Structure

```
app/                    # Expo Router routes
  _layout.tsx           # Root layout with providers
  index.tsx             # Main game screen
components/             # Shared UI components
  AchievementsOverlay.tsx
  AchievementToast.tsx
  ErrorBoundary.tsx / ErrorFallback.tsx
  GameOverOverlay.tsx
  GridBackground.tsx
  MainMenu.tsx
  ModeSelect.tsx
  ScoresOverlay.tsx
  SettingsOverlay.tsx
  TargetRings.tsx
hooks/
  useGameLoop.ts        # Core game loop logic
lib/
  achievements.ts       # Achievement definitions
  SettingsContext.tsx   # App-wide settings state
  sounds.ts             # Sound manager
assets/                 # Images and audio files
patches/                # patch-package patches for expo-asset
```

## Running the App

- **Workflow**: "Start application" runs `npx expo start --web --port 5000 --host lan`
- **Web Preview**: Available on port 5000
- **Mobile**: Scan QR code with Expo Go app
- **Hot Reload**: Enabled by default, no restart needed for most code changes

## Deployment

- **Target**: Static site (Expo web export)
- **Build Command**: `npx expo export --platform web --output-dir dist`
- **Public Dir**: `dist`
