import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "ringlock_streak";
const LAST_PLAY_KEY = "ringlock_last_play_date";

function todayString(): string {
    return new Date().toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return Math.round(Math.abs(da - db) / (1000 * 60 * 60 * 24));
}

export interface StreakInfo {
    streak: number;
    lastPlayDate: string;
    playedToday: boolean;
}

export async function getStreakInfo(): Promise<StreakInfo> {
    const [rawStreak, lastPlay] = await Promise.all([
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(LAST_PLAY_KEY),
    ]);
    const streak = rawStreak ? parseInt(rawStreak, 10) : 0;
    const lastPlayDate = lastPlay ?? "";
    const today = todayString();
    return {
        streak,
        lastPlayDate,
        playedToday: lastPlayDate === today,
    };
}

export async function recordPlayToday(): Promise<StreakInfo> {
    const today = todayString();
    const info = await getStreakInfo();

    if (info.playedToday) return info;

    let newStreak: number;
    if (!info.lastPlayDate) {
        newStreak = 1;
    } else {
        const gap = daysBetween(info.lastPlayDate, today);
        if (gap === 1) {
            newStreak = info.streak + 1;
        } else {
            newStreak = 1;
        }
    }

    await Promise.all([
        AsyncStorage.setItem(STREAK_KEY, String(newStreak)),
        AsyncStorage.setItem(LAST_PLAY_KEY, today),
    ]);

    return { streak: newStreak, lastPlayDate: today, playedToday: true };
}
