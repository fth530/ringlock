import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const LAST_REVIEW_KEY = "ringlock_last_review_date";
const MIN_GAMES_FOR_REVIEW = 5;
const REVIEW_COOLDOWN_DAYS = 30;

function todayString(): string {
    return new Date().toISOString().split("T")[0];
}

function daysSince(dateStr: string): number {
    if (!dateStr) return 999;
    const past = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.floor((now - past) / (1000 * 60 * 60 * 24));
}

export async function maybeRequestReview(totalGames: number): Promise<void> {
    try {
        if (totalGames < MIN_GAMES_FOR_REVIEW) return;
        if (totalGames % MIN_GAMES_FOR_REVIEW !== 0) return;

        const lastReview = await AsyncStorage.getItem(LAST_REVIEW_KEY);
        if (lastReview && daysSince(lastReview) < REVIEW_COOLDOWN_DAYS) return;

        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) return;

        await StoreReview.requestReview();
        await AsyncStorage.setItem(LAST_REVIEW_KEY, todayString());
    } catch {
    }
}
