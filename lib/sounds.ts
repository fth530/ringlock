// Import directly from the sub-module to avoid the broken root index.js
// expo-av's root index re-exports AV.types which has a Metro resolution bug
// in this SDK version. The individual Audio module works perfectly.
import { Sound, setAudioModeAsync } from "expo-av/build/Audio";

// ─── Audio files ──────────────────────────────────────────────────────────────
// Generated synth sounds are in assets/sounds/.
// Replace them with your own WAV/MP3 files anytime — drop them in the same
// folder with the same names and the code requires no changes.
const SOURCES = {
  success: require("../assets/sounds/success.wav"),
  gameover: require("../assets/sounds/gameover.wav"),
} as const;

type SoundKey = keyof typeof SOURCES;

class SoundManager {
  private sounds: Partial<Record<SoundKey, Sound>> = {};
  private ready = false;

  async init() {
    if (this.ready) return;
    try {
      await setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });

      for (const key of Object.keys(SOURCES) as SoundKey[]) {
        const { sound } = await Sound.createAsync(SOURCES[key], {
          shouldPlay: false,
          volume: 1.0,
        });
        this.sounds[key] = sound;
      }

      this.ready = true;
    } catch (e) {
      // Fail silently — audio is enhancement-only, never blocks gameplay
      console.warn("[SoundManager] init failed:", e);
    }
  }

  async play(key: SoundKey) {
    const sound = this.sounds[key];
    if (!sound) return;
    try {
      // replayAsync resets position to 0 and plays — ideal for SFX
      await sound.replayAsync();
    } catch (_) {
      // Never let audio errors interrupt the game loop
    }
  }

  async release() {
    for (const sound of Object.values(this.sounds)) {
      try {
        await sound?.unloadAsync();
      } catch (_) {}
    }
    this.sounds = {};
    this.ready = false;
  }
}

// Singleton shared across the app lifetime
export const soundManager = new SoundManager();
