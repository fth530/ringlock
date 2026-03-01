// Dynamic lazy import — ensures that any native module load failure
// is caught at runtime and never crashes the app. Audio is enhancement-only.
// We require from the sub-module path to avoid expo-audio's broken root index.

type SoundLike = {
  replayAsync(): Promise<unknown>;
  unloadAsync(): Promise<unknown>;
};

type SoundConstructor = {
  createAsync(
    source: unknown,
    initialStatus?: { shouldPlay?: boolean; volume?: number }
  ): Promise<{ sound: SoundLike }>;
};

const SOURCES: Record<string, unknown> = {
  success: require("../assets/sounds/success.wav"),
  gameover: require("../assets/sounds/gameover.wav"),
};

type SoundKey = keyof typeof SOURCES;

class SoundManager {
  private sounds: Partial<Record<SoundKey, SoundLike>> = {};
  private ready = false;

  async init() {
    if (this.ready) return;
    try {
      // Dynamic require keeps the import inside a try-catch so any
      // native module unavailability is caught rather than crashing.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Sound, setAudioModeAsync } = require("expo-av/build/Audio") as {
        Sound: SoundConstructor;
        setAudioModeAsync: (mode: Record<string, unknown>) => Promise<void>;
      };

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
      // Never block gameplay — audio is enhancement-only
      console.warn("[SoundManager] init failed:", e);
    }
  }

  async play(key: SoundKey) {
    const sound = this.sounds[key];
    if (!sound) return;
    try {
      // replayAsync resets position to 0 and plays — ideal for low-latency SFX
      await sound.replayAsync();
    } catch (_) {
      // Swallow — never interrupt gameplay for audio errors
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

export const soundManager = new SoundManager();
