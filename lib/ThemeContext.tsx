import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RingTheme {
    id: string;
    name: string;
    color: string;
    borderGlow: string;
    emoji: string;
    unlockDesc: string;
    unlockKey: string;
}

export interface BgTheme {
    id: string;
    name: string;
    colors: [string, string, string];
    accentColor: string;
    emoji: string;
    unlockDesc: string;
    unlockKey: string;
}

export const RING_THEMES: RingTheme[] = [
    {
        id: "pink",
        name: "NEON PEMBE",
        color: "#FF0066",
        borderGlow: "rgba(255,0,102,0.5)",
        emoji: "🌸",
        unlockDesc: "Başlangıç",
        unlockKey: "start",
    },
    {
        id: "cyan",
        name: "SİBER MAVİ",
        color: "#00FFE8",
        borderGlow: "rgba(0,255,232,0.5)",
        emoji: "💎",
        unlockDesc: "25 Puan Yap",
        unlockKey: "score_25",
    },
    {
        id: "gold",
        name: "ALTIN",
        color: "#FFD700",
        borderGlow: "rgba(255,215,0,0.5)",
        emoji: "✨",
        unlockDesc: "50 Puan Yap",
        unlockKey: "score_50",
    },
    {
        id: "purple",
        name: "MOR GECE",
        color: "#A855F7",
        borderGlow: "rgba(168,85,247,0.5)",
        emoji: "🔮",
        unlockDesc: "10 Oyun Oyna",
        unlockKey: "games_10",
    },
    {
        id: "fire",
        name: "ATEŞ",
        color: "#FF4500",
        borderGlow: "rgba(255,69,0,0.5)",
        emoji: "🔥",
        unlockDesc: "100 Puan Yap",
        unlockKey: "score_100",
    },
    {
        id: "rainbow",
        name: "GÖKKUŞAĞI",
        color: "#FF0099",
        borderGlow: "rgba(255,0,153,0.5)",
        emoji: "🌈",
        unlockDesc: "50 Oyun Oyna",
        unlockKey: "games_50",
    },
];

export const BG_THEMES: BgTheme[] = [
    {
        id: "space",
        name: "UZAY",
        colors: ["#030310", "#08082a", "#030310"],
        accentColor: "#00FFE8",
        emoji: "🌌",
        unlockDesc: "Başlangıç",
        unlockKey: "start",
    },
    {
        id: "ocean",
        name: "OKYANUS",
        colors: ["#020a1a", "#041535", "#020a1a"],
        accentColor: "#00BFFF",
        emoji: "🌊",
        unlockDesc: "10 Oyun Oyna",
        unlockKey: "games_10",
    },
    {
        id: "lava",
        name: "LAVA",
        colors: ["#150300", "#2a0800", "#150300"],
        accentColor: "#FF4500",
        emoji: "🌋",
        unlockDesc: "25 Puan Yap",
        unlockKey: "score_25",
    },
    {
        id: "forest",
        name: "ORMAN",
        colors: ["#021008", "#051a0c", "#021008"],
        accentColor: "#00FF88",
        emoji: "🌿",
        unlockDesc: "50 Puan Yap",
        unlockKey: "score_50",
    },
    {
        id: "galaxy",
        name: "GALAKSİ",
        colors: ["#0a0215", "#1a0a2e", "#0a0215"],
        accentColor: "#A855F7",
        emoji: "🔭",
        unlockDesc: "100 Puan Yap",
        unlockKey: "score_100",
    },
];

export function isThemeUnlocked(unlockKey: string, stats: { totalGames: number; bestScore: number }): boolean {
    if (unlockKey === "start") return true;
    if (unlockKey.startsWith("score_")) {
        return stats.bestScore >= parseInt(unlockKey.split("_")[1], 10);
    }
    if (unlockKey.startsWith("games_")) {
        return stats.totalGames >= parseInt(unlockKey.split("_")[1], 10);
    }
    return false;
}

const STORAGE_KEY = "ringlock_theme";

interface ThemeState {
    activeRingId: string;
    activeBgId: string;
    setRingTheme: (id: string) => void;
    setBgTheme: (id: string) => void;
    activeRing: RingTheme;
    activeBg: BgTheme;
}

const defaultRing = RING_THEMES[0];
const defaultBg = BG_THEMES[0];

const ThemeContext = createContext<ThemeState>({
    activeRingId: defaultRing.id,
    activeBgId: defaultBg.id,
    setRingTheme: () => { },
    setBgTheme: () => { },
    activeRing: defaultRing,
    activeBg: defaultBg,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [activeRingId, setActiveRingId] = useState(defaultRing.id);
    const [activeBgId, setActiveBgId] = useState(defaultBg.id);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed.ring) setActiveRingId(parsed.ring);
                    if (parsed.bg) setActiveBgId(parsed.bg);
                } catch { }
            }
        });
    }, []);

    const persist = useCallback((ring: string, bg: string) => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ring, bg }));
    }, []);

    const setRingTheme = useCallback((id: string) => {
        setActiveRingId(id);
        setActiveBgId((prev) => {
            persist(id, prev);
            return prev;
        });
    }, [persist]);

    const setBgTheme = useCallback((id: string) => {
        setActiveBgId(id);
        setActiveRingId((prev) => {
            persist(prev, id);
            return prev;
        });
    }, [persist]);

    const activeRing = RING_THEMES.find((t) => t.id === activeRingId) ?? defaultRing;
    const activeBg = BG_THEMES.find((t) => t.id === activeBgId) ?? defaultBg;

    return (
        <ThemeContext.Provider value={{ activeRingId, activeBgId, setRingTheme, setBgTheme, activeRing, activeBg }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
