import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ringlock_achievements";

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    condition: (stats: GameStats) => boolean;
}

export interface GameStats {
    score: number;
    maxCombo: number;
    perfectCount: number;
    goodCount: number;
    lateCount: number;
    missCount: number;
    totalGames: number;
    totalScore: number;
    gameMode: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    // Skor hedefleri
    { id: "score_10", title: "ISINMA TURU", description: "10 puana ulas", icon: "⚡", condition: (s) => s.score >= 10 },
    { id: "score_25", title: "IYIYE GIDIYOR", description: "25 puana ulas", icon: "🔥", condition: (s) => s.score >= 25 },
    { id: "score_50", title: "ALEVLERDE", description: "50 puana ulas", icon: "💎", condition: (s) => s.score >= 50 },
    { id: "score_100", title: "EFSANE", description: "100 puana ulas", icon: "👑", condition: (s) => s.score >= 100 },

    // Kombo basarimlari
    { id: "combo_10", title: "KOMBO BASLANGIC", description: "10x kombo yap", icon: "🔗", condition: (s) => s.maxCombo >= 10 },
    { id: "combo_25", title: "ZINCIR USTASI", description: "25x kombo yap", icon: "⛓", condition: (s) => s.maxCombo >= 25 },
    { id: "combo_50", title: "DURDURULAMAZ", description: "50x kombo yap", icon: "💫", condition: (s) => s.maxCombo >= 50 },

    // Mukemmel basarimlari
    { id: "perfect_5", title: "KESKIN GOZ", description: "Bir oyunda 5 MUKEMMEL yap", icon: "🎯", condition: (s) => s.perfectCount >= 5 },
    { id: "perfect_15", title: "HASSASIYET", description: "Bir oyunda 15 MUKEMMEL yap", icon: "✨", condition: (s) => s.perfectCount >= 15 },
    { id: "perfect_only", title: "KUSURSUZ", description: "10+ skor, sadece MUKEMMEL", icon: "💠", condition: (s) => s.score >= 10 && s.goodCount === 0 && s.lateCount === 0 && s.missCount === 0 },

    // Mod basarimlari
    { id: "hardcore_20", title: "ÇELİK SINIRLAR", description: "Hardcore'da 20 puan", icon: "🗡", condition: (s) => s.gameMode === "hardcore" && s.score >= 20 },
    { id: "speed_30", title: "HIZ ŞEYTANI", description: "Speed Rush'ta 30 puan", icon: "⏱", condition: (s) => s.gameMode === "speed" && s.score >= 30 },
    { id: "zen_100", title: "İÇ HUZUR", description: "Zen'de 100 puan", icon: "🧘", condition: (s) => s.gameMode === "zen" && s.score >= 100 },
    { id: "mirror_15", title: "AYNA USTASI", description: "Ayna modunda 15 puan", icon: "🪞", condition: (s) => s.gameMode === "mirror" && s.score >= 15 },
    { id: "mirror_30", title: "TERSYÜZ", description: "Ayna modunda 30 puan", icon: "🔄", condition: (s) => s.gameMode === "mirror" && s.score >= 30 },
    { id: "dual_10", title: "ÇİFT YETENEK", description: "İkiz modunda 10 puan", icon: "⊕", condition: (s) => s.gameMode === "dual" && s.score >= 10 },
    { id: "dual_25", title: "İKİZ EFSANE", description: "İkiz modunda 25 puan", icon: "✦", condition: (s) => s.gameMode === "dual" && s.score >= 25 },

    // Baglilik
    { id: "games_10", title: "SADIK OYUNCU", description: "10 oyun oyna", icon: "🏅", condition: (s) => s.totalGames >= 10 },
    { id: "games_50", title: "BAĞIMLI", description: "50 oyun oyna", icon: "🏆", condition: (s) => s.totalGames >= 50 },
    { id: "total_500", title: "KASICI", description: "Toplam 500 puan kas", icon: "⭐", condition: (s) => s.totalScore >= 500 },
];

export async function getUnlockedAchievements(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

export async function getLifetimeStats(): Promise<{ totalGames: number; totalScore: number }> {
    const games = await AsyncStorage.getItem("ringlock_total_games");
    const score = await AsyncStorage.getItem("ringlock_total_score");
    return {
        totalGames: games ? parseInt(games, 10) : 0,
        totalScore: score ? parseInt(score, 10) : 0,
    };
}

export async function updateLifetimeStats(score: number): Promise<{ totalGames: number; totalScore: number }> {
    const prev = await getLifetimeStats();
    const totalGames = prev.totalGames + 1;
    const totalScore = prev.totalScore + score;
    await AsyncStorage.setItem("ringlock_total_games", String(totalGames));
    await AsyncStorage.setItem("ringlock_total_score", String(totalScore));
    return { totalGames, totalScore };
}

export async function checkAchievements(stats: GameStats): Promise<Achievement[]> {
    const unlocked = await getUnlockedAchievements();
    const newlyUnlocked: Achievement[] = [];

    for (const ach of ACHIEVEMENTS) {
        if (!unlocked.includes(ach.id) && ach.condition(stats)) {
            newlyUnlocked.push(ach);
            unlocked.push(ach.id);
        }
    }

    if (newlyUnlocked.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    }

    return newlyUnlocked;
}
