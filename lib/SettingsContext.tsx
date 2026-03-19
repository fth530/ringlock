import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    toggleSound: () => void;
    toggleVibration: () => void;
    resetAllData: () => Promise<void>;
}

const STORAGE_KEY = "ringlock_settings";

const ALL_KEYS = [
    "ringlock_settings",
    "ringlock_best",
    "ringlock_best_hardcore",
    "ringlock_best_zen",
    "ringlock_best_speed",
    "ringlock_achievements",
    "ringlock_total_games",
    "ringlock_total_score",
];

const SettingsContext = createContext<SettingsState>({
    soundEnabled: true,
    vibrationEnabled: true,
    toggleSound: () => { },
    toggleVibration: () => { },
    resetAllData: async () => { },
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (typeof parsed.soundEnabled === "boolean") setSoundEnabled(parsed.soundEnabled);
                    if (typeof parsed.vibrationEnabled === "boolean") setVibrationEnabled(parsed.vibrationEnabled);
                } catch {
                }
            }
        });
    }, []);

    const persist = useCallback((sound: boolean, vibration: boolean) => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ soundEnabled: sound, vibrationEnabled: vibration }));
    }, []);

    const toggleSound = useCallback(() => {
        setSoundEnabled((prev) => {
            const next = !prev;
            persist(next, vibrationEnabled);
            return next;
        });
    }, [vibrationEnabled, persist]);

    const toggleVibration = useCallback(() => {
        setVibrationEnabled((prev) => {
            const next = !prev;
            persist(soundEnabled, next);
            return next;
        });
    }, [soundEnabled, persist]);

    const resetAllData = useCallback(async () => {
        await AsyncStorage.multiRemove(ALL_KEYS);
        setSoundEnabled(true);
        setVibrationEnabled(true);
    }, []);

    return (
        <SettingsContext.Provider value={{ soundEnabled, vibrationEnabled, toggleSound, toggleVibration, resetAllData }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
