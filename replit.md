# Antigravity — Replit.md

## Overview

Antigravity is a hypercasual mobile game built with React Native and Expo. The core mechanic is a timing-based tap game: a shrinking neon ring closes in on a stationary target ring, and the player must tap the screen at exactly the right moment. The game features a dark cyberpunk visual theme with neon glows, progressive difficulty, haptic feedback, sound effects, and local high-score persistence.

The project runs as a full-stack app: an Expo/React Native frontend (served via Metro bundler) paired with a lightweight Express backend. Both run inside Replit, with the mobile app accessible via Expo Go or as a static web build.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK ~54 with Expo Router v6 for file-based navigation. The app currently has a single screen (`app/index.tsx`) which is the full game.
- **Routing**: Expo Router with typed routes enabled. `app/_layout.tsx` sets up the root stack with no headers, wrapping everything in `QueryClientProvider`, `GestureHandlerRootView`, and a custom `ErrorBoundary`.
- **Animations**: All game animations use `react-native-reanimated` v4 (`useSharedValue`, `withTiming`, `withSequence`, `withRepeat`, etc.) to run on the UI thread at 60fps without blocking JS.
- **Haptics**: `expo-haptics` for touch feedback on hits and game-over events.
- **Sound**: `expo-av` audio loaded lazily via a `SoundManager` class (`lib/sounds.ts`) so audio failures never crash the game.
- **Fonts**: Orbitron (Regular, Bold, Black) loaded via `@expo-google-fonts/orbitron` for the cyberpunk aesthetic.
- **Local Storage**: `@react-native-async-storage/async-storage` for persisting the best score locally on device.
- **State / Data Fetching**: TanStack React Query v5 is set up globally (via `lib/query-client.ts`) for any API calls, though current game logic is fully client-side.

### Backend (Express)

- **Framework**: Express v5 (`server/index.ts`) running via `tsx` in development, bundled with `esbuild` for production.
- **Routes**: Defined in `server/routes.ts`. Currently minimal (no game-specific API endpoints yet). All routes are prefixed with `/api`.
- **Storage**: `server/storage.ts` provides a `MemStorage` class implementing `IStorage` (get/create users). Swappable with a database-backed implementation.
- **CORS**: Configured dynamically to allow Replit dev/deployment domains and localhost origins for Expo web dev.
- **Static serving**: In production, the server serves the Expo static web build from the `dist/` folder and falls back to a landing page HTML template for non-API routes.

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle.config.ts` points to `DATABASE_URL`).
- **Schema** (`shared/schema.ts`): Currently defines a `users` table with `id` (UUID), `username`, and `password`. Zod schemas are generated via `drizzle-zod` for type-safe inserts.
- **Migrations**: Stored in `./migrations/`, managed with `drizzle-kit push` (`npm run db:push`).
- **Note**: The database is provisioned separately; `DATABASE_URL` must be set as an environment variable. The game itself currently uses only local AsyncStorage for scores — the DB is available for future leaderboard or auth features.

### Shared Code

- The `shared/` directory contains schema types used by both the server and the client, enabling type-safe API contracts without duplication.

### Build & Dev Scripts

| Script | Purpose |
|---|---|
| `npm run expo:dev` | Start Expo Metro dev server (sets Replit domain env vars) |
| `npm run server:dev` | Start Express server with `tsx` hot reload |
| `npm run expo:static:build` | Build static Expo web output via `scripts/build.js` |
| `npm run server:build` | Bundle server with esbuild for production |
| `npm run db:push` | Push Drizzle schema to Postgres |

### Key Design Decisions

1. **Single-screen game**: All game logic lives in `app/index.tsx`. Constants (ring sizes, timing, palette) are defined at the top of the file for easy tuning.
2. **Reanimated for all animations**: Keeps the game loop off the JS thread, preventing jank. Standard RN `Animated` is deliberately avoided for core game mechanics.
3. **Lazy audio loading**: `SoundManager` uses dynamic `require` inside a try/catch so audio module failures are silently ignored — audio is enhancement-only, never a crash source.
4. **Error boundary**: A class-based `ErrorBoundary` wraps the entire app to catch render errors and show a recovery UI without a full crash.
5. **Monorepo-style layout**: Frontend, backend, and shared schema all live in the same repo with TypeScript path aliases (`@/*` and `@shared/*`) for clean imports.

## External Dependencies

| Dependency | Purpose |
|---|---|
| **Expo / Expo Router** | App framework, file-based navigation, OTA updates |
| **react-native-reanimated** | High-performance UI-thread animations for the game loop |
| **expo-haptics** | Haptic feedback on hit/game-over |
| **expo-av** | Audio playback (success/gameover sounds) |
| **expo-linear-gradient** | Neon gradient backgrounds and ring effects |
| **expo-blur** | Blur effects for UI overlays |
| **expo-image-picker** | Available for future profile/avatar features |
| **expo-location** | Available for future location-based features |
| **@react-native-async-storage/async-storage** | Local best-score persistence |
| **@tanstack/react-query** | Server state management / API data fetching |
| **drizzle-orm + drizzle-kit** | Type-safe PostgreSQL ORM and migration tool |
| **drizzle-zod** | Auto-generates Zod schemas from Drizzle table definitions |
| **express** | Backend HTTP server |
| **pg** | PostgreSQL client for Node.js |
| **@expo-google-fonts/orbitron** | Cyberpunk-style font family |
| **react-native-gesture-handler** | Touch gesture primitives |
| **react-native-safe-area-context** | Safe area insets for notch/home bar awareness |
| **react-native-svg** | SVG rendering (available for ring/glow effects) |
| **http-proxy-middleware** | Dev proxy between Expo and Express server |

### Environment Variables Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required for DB features) |
| `EXPO_PUBLIC_DOMAIN` | Domain used by the mobile app to reach the API server |
| `REPLIT_DEV_DOMAIN` | Injected by Replit; used for CORS and Metro proxy config |
| `REPLIT_DOMAINS` | Comma-separated deployment domains for CORS allowlist |