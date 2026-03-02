import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    toggleSound: () => void;
    toggleVibration: () => void;
}

const STORAGE_KEY = "ringlock_settings";

const SettingsContext = createContext<SettingsState>({
    soundEnabled: true,
    vibrationEnabled: true,
    toggleSound: () => { },
    toggleVibration: () => { },
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    // Load saved settings
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (typeof parsed.soundEnabled === "boolean") setSoundEnabled(parsed.soundEnabled);
                    if (typeof parsed.vibrationEnabled === "boolean") setVibrationEnabled(parsed.vibrationEnabled);
                } catch {
                    // silently ignore
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

    return (
        <SettingsContext.Provider value={{ soundEnabled, vibrationEnabled, toggleSound, toggleVibration }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
