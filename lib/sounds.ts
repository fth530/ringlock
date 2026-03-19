import { Audio } from "expo-av";
import { HitQuality } from "@/constants/game";

type SoundKey = "perfect" | "good" | "late" | "miss" | "combo_high" | "gameover";

class SoundManager {
    private sounds: Partial<Record<SoundKey, Audio.Sound>> = {};

    async init() {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const entries: [SoundKey, ReturnType<typeof require>][] = [
                ["perfect",    require("../assets/sounds/perfect.wav")],
                ["good",       require("../assets/sounds/good.wav")],
                ["late",       require("../assets/sounds/late.wav")],
                ["miss",       require("../assets/sounds/miss.wav")],
                ["combo_high", require("../assets/sounds/combo_high.wav")],
                ["gameover",   require("../assets/sounds/gameover.wav")],
            ];

            await Promise.all(entries.map(async ([key, asset]) => {
                const sound = new Audio.Sound();
                await sound.loadAsync(asset);
                this.sounds[key] = sound;
            }));
        } catch (e) {
            console.warn("Sound init failed:", e);
        }
    }

    private async _play(key: SoundKey) {
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

    async play(key: "gameover") {
        await this._play(key);
    }

    async playHit(quality: HitQuality, combo: number) {
        const key: SoundKey =
            quality === "perfect" ? "perfect" :
            quality === "good"    ? "good"    : "late";
        await this._play(key);
        if (combo >= 10) {
            setTimeout(() => { this._play("combo_high"); }, 90);
        }
    }

    async playMiss() {
        await this._play("miss");
    }

    async release() {
        try {
            await Promise.all(
                Object.values(this.sounds).map((s) => s?.unloadAsync())
            );
            this.sounds = {};
        } catch {
            // Hataları göz ardı et
        }
    }
}

export const soundManager = new SoundManager();
