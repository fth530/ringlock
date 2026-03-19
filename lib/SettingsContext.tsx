import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Settings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    largeText: boolean;
    highContrast: boolean;
}

interface SettingsState extends Settings {
    toggleSound: () => void;
    toggleVibration: () => void;
    toggleLargeText: () => void;
    toggleHighContrast: () => void;
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
    "ringlock_tutorial_done",
    "ringlock_theme",
    "ringlock_streak",
    "ringlock_last_play_date",
    "ringlock_last_review_date",
    "ringlock_best_combo",
    "ringlock_daily_completed_count",
];

const DEFAULT: Settings = {
    soundEnabled: true,
    vibrationEnabled: true,
    largeText: false,
    highContrast: false,
};

const SettingsContext = createContext<SettingsState>({
    ...DEFAULT,
    toggleSound: () => { },
    toggleVibration: () => { },
    toggleLargeText: () => { },
    toggleHighContrast: () => { },
    resetAllData: async () => { },
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT);
    const settingsRef = useRef<Settings>(DEFAULT);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    const loaded: Settings = {
                        soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : true,
                        vibrationEnabled: typeof parsed.vibrationEnabled === "boolean" ? parsed.vibrationEnabled : true,
                        largeText: typeof parsed.largeText === "boolean" ? parsed.largeText : false,
                        highContrast: typeof parsed.highContrast === "boolean" ? parsed.highContrast : false,
                    };
                    settingsRef.current = loaded;
                    setSettings(loaded);
                } catch { }
            }
        });
    }, []);

    const update = useCallback((patch: Partial<Settings>) => {
        const next = { ...settingsRef.current, ...patch };
        settingsRef.current = next;
        setSettings(next);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, []);

    const toggleSound = useCallback(() => update({ soundEnabled: !settingsRef.current.soundEnabled }), [update]);
    const toggleVibration = useCallback(() => update({ vibrationEnabled: !settingsRef.current.vibrationEnabled }), [update]);
    const toggleLargeText = useCallback(() => update({ largeText: !settingsRef.current.largeText }), [update]);
    const toggleHighContrast = useCallback(() => update({ highContrast: !settingsRef.current.highContrast }), [update]);

    const resetAllData = useCallback(async () => {
        await AsyncStorage.multiRemove(ALL_KEYS);
        settingsRef.current = DEFAULT;
        setSettings(DEFAULT);
    }, []);

    return (
        <SettingsContext.Provider value={{
            ...settings,
            toggleSound,
            toggleVibration,
            toggleLargeText,
            toggleHighContrast,
            resetAllData,
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
