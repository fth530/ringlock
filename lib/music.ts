import { Audio } from "expo-av";

class MusicManager {
    private sound: Audio.Sound | null = null;
    private loaded = false;
    private playing = false;
    private _enabled = false;  // Settings yüklenene kadar kapalı başla

    async init() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require("@/assets/sounds/music.wav"),
                {
                    isLooping: true,
                    volume: 0.45,
                    shouldPlay: false,
                }
            );
            this.sound = sound;
            this.loaded = true;
        } catch (e) {
            console.warn("[MusicManager] init failed:", e);
        }
    }

    async setEnabled(enabled: boolean) {
        this._enabled = enabled;
        if (enabled) {
            await this.play();
        } else {
            await this.pause();
        }
    }

    async play() {
        if (!this.loaded || !this._enabled || this.playing) return;
        try {
            await this.sound?.playAsync();
            this.playing = true;
        } catch (e) {
            console.warn("[MusicManager] play failed:", e);
        }
    }

    async pause() {
        if (!this.loaded || !this.playing) return;
        try {
            await this.sound?.pauseAsync();
            this.playing = false;
        } catch (e) {
            console.warn("[MusicManager] pause failed:", e);
        }
    }

    async release() {
        try {
            await this.sound?.unloadAsync();
        } catch {}
        this.sound = null;
        this.loaded = false;
        this.playing = false;
    }
}

export const musicManager = new MusicManager();
