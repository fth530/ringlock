import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameMode } from "@/constants/game";

export interface DailyChallenge {
    date: string;
    type: "score" | "combo" | "perfect";
    target: number;
    mode: GameMode;
    title: string;
    description: string;
    emoji: string;
}

export interface DailyChallengeResult {
    completed: boolean;
    score?: number;
}

function dateString(d = new Date()): string {
    return d.toISOString().split("T")[0];
}

function seedRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

export function generateDailyChallenge(date = new Date()): DailyChallenge {
    const parts = date.toISOString().split("T")[0].split("-");
    const seed = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
    const rng = seedRng(seed);

    const typeIdx = Math.floor(rng() * 3);
    const modeIdx = Math.floor(rng() * 4);
    const modes: GameMode[] = ["classic", "hardcore", "zen", "speed"];
    const mode = modes[modeIdx];

    let type: "score" | "combo" | "perfect";
    let target: number;
    let title: string;
    let description: string;
    let emoji: string;

    if (typeIdx === 0) {
        type = "score";
        const targets = [10, 15, 20, 25, 30];
        target = targets[Math.floor(rng() * targets.length)];
        title = `${target} PUAN`;
        description = `${mode.toUpperCase()} modunda ${target} puan yap`;
        emoji = "🎯";
    } else if (typeIdx === 1) {
        type = "combo";
        const targets = [5, 8, 10, 12, 15];
        target = targets[Math.floor(rng() * targets.length)];
        title = `${target}x KOMBO`;
        description = `Herhangi bir modda ${target} kombo yap`;
        emoji = "🔗";
    } else {
        type = "perfect";
        const targets = [3, 5, 7, 10];
        target = targets[Math.floor(rng() * targets.length)];
        title = `${target} MÜKEMMEL`;
        description = `Tek oyunda ${target} MÜKEMMEL isabet yap`;
        emoji = "💠";
    }

    return { date: dateString(date), type, target, mode, title, description, emoji };
}

function challengeKey(date: string) {
    return `ringlock_daily_${date}`;
}

export async function getDailyChallengeResult(date: string): Promise<DailyChallengeResult | null> {
    const raw = await AsyncStorage.getItem(challengeKey(date));
    if (!raw) return null;
    return JSON.parse(raw);
}

export async function completeDailyChallenge(date: string, score: number): Promise<void> {
    const result: DailyChallengeResult = { completed: true, score };
    await AsyncStorage.setItem(challengeKey(date), JSON.stringify(result));
}

export async function checkAndCompleteDailyChallenge(
    challenge: DailyChallenge,
    gameStats: { score: number; maxCombo: number; perfectCount: number; gameMode: GameMode }
): Promise<boolean> {
    const existing = await getDailyChallengeResult(challenge.date);
    if (existing?.completed) return false;

    let achieved = false;
    if (challenge.type === "score" && gameStats.score >= challenge.target) {
        if (challenge.mode === "classic" || gameStats.gameMode === challenge.mode) {
            achieved = true;
        }
    } else if (challenge.type === "combo" && gameStats.maxCombo >= challenge.target) {
        achieved = true;
    } else if (challenge.type === "perfect" && gameStats.perfectCount >= challenge.target) {
        achieved = true;
    }

    if (achieved) {
        await completeDailyChallenge(challenge.date, gameStats.score);
    }
    return achieved;
}
