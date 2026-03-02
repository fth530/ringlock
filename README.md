# 🎯 RingLock

**A precision-based arcade game built with React Native & Expo.**

Tap the screen at the exact moment the shrinking ring locks onto the target. Simple to learn, impossible to master.

---

## 🎮 Gameplay

- A **neon pink ring** shrinks from the edges of the screen toward a fixed **cyan target ring**
- Tap the screen when the rings **overlap perfectly**
- Each successful hit spawns a new ring at a random position — faster than before
- Miss 3 times and it's **Game Over**

### Hit Quality System
| Quality | Precision | Feedback |
|---------|-----------|----------|
| ⭐ **PERFECT** | ±5px | Strong haptic + bright flash |
| ✅ **GOOD** | ±10px | Medium haptic |
| ⚠️ **LATE** | ±18px | Light haptic |
| ❌ **MISS** | Beyond | Lose a life |

### Combo System 🔥
- Build combos with consecutive hits
- **3x** → GOOD | **5x** → GREAT | **10x** → INSANE
- Every **15 combo** earns an extra life (max 3)

### Visual Phases 🌈
The background evolves as you progress:
- Score 10+ → Deep blue atmosphere
- Score 25+ → Purple neon shift  
- Score 50+ → Full cyberpunk mode

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** (SDK 54) | Development & build toolchain |
| **Expo Router** | File-based navigation |
| **React Native Reanimated** | 60fps UI thread animations |
| **expo-av** | Native audio playback |
| **expo-haptics** | Haptic feedback |
| **AsyncStorage** | Offline score persistence |

---

## 📁 Project Structure

```
ringlock/
├── app/
│   ├── _layout.tsx          # Root layout, splash screen, providers
│   ├── index.tsx             # Main game screen + HUD components
│   ├── +not-found.tsx        # 404 page (themed)
│   └── +native-intent.tsx    # Deep link handler
├── components/
│   ├── TargetRings.tsx       # Target + shrinking ring (scale-based)
│   ├── MainMenu.tsx          # Title screen
│   ├── GameOverOverlay.tsx   # Game over screen with stats
│   ├── SettingsOverlay.tsx   # Sound & vibration toggles
│   ├── GridBackground.tsx    # Cyberpunk grid effect
│   ├── ErrorBoundary.tsx     # Error boundary wrapper
│   └── ErrorFallback.tsx     # Error fallback UI
├── hooks/
│   ├── useGameLoop.ts        # Core game logic & state machine
│   └── useGameLoop.test.ts   # Unit tests
├── lib/
│   ├── sounds.ts             # Audio manager (expo-av)
│   └── SettingsContext.tsx    # Settings provider (sound/vibration)
├── constants/
│   └── game.ts               # Game constants, colors, types
└── assets/
    ├── icon.png              # App icon
    ├── splash.png            # Splash screen
    └── sounds/
        ├── success.wav       # Hit sound
        └── gameover.wav      # Game over sound
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Install & Run

```bash
# Clone the repository
git clone https://github.com/fth530/ringlock.git
cd ringlock

# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with Expo Go to play on your device.

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## ⚙️ Settings

Access settings from the **⚙ gear icon** on the main menu:
- **Sound** — Toggle sound effects on/off
- **Vibration** — Toggle haptic feedback on/off

Settings are persisted locally via AsyncStorage.

---

## 🧪 Testing

```bash
npm test
```

Tests cover: initialization, game state transitions, lives system, combo reset, and menu navigation.

---

## 📱 Platform Support

| Platform | Status |
|----------|--------|
| Android | ✅ Fully supported |
| iOS | ✅ Fully supported |
| Web | ⚠️ Basic support (no haptics) |

---

## 📄 License

MIT

---

<p align="center">
  Built with ❤️ and React Native
</p>
