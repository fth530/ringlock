import { Platform } from "react-native";
import { Audio } from "expo-av";

type SoundKey = "success" | "gameover";

class SoundManager {
  private sounds: Record<SoundKey, Audio.Sound | null> = {
    success: null,
    gameover: null,
  };

  async init() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const successSound = new Audio.Sound();
      await successSound.loadAsync(require("../assets/sounds/success.wav"));
      this.sounds.success = successSound;

      const gameOverSound = new Audio.Sound();
      await gameOverSound.loadAsync(require("../assets/sounds/gameover.wav"));
      this.sounds.gameover = gameOverSound;
    } catch (e) {
      console.warn("Sound init failed:", e);
    }
  }

  async play(key: SoundKey) {
    try {
      const sound = this.sounds[key];
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch {
      // Oyun akışını bozmamak için ses hatalarını es geçiyoruz
    }
  }

  async release() {
    try {
      if (this.sounds.success) await this.sounds.success.unloadAsync();
      if (this.sounds.gameover) await this.sounds.gameover.unloadAsync();
    } catch {
      // Hataları göz ardı et
    }
  }
}

export const soundManager = new SoundManager();
