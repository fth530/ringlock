import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { C, GameMode, GAME_MODES } from "@/constants/game";
import { isRewardedReady, showRewarded } from "@/lib/ads";

const AD_UNLOCK_PREFIX = "ringlock_ad_unlock_";

const MODE_ORDER: GameMode[] = ["classic", "hardcore", "zen", "speed", "mirror", "dual", "chaos"];

const MODE_COLORS: Record<GameMode, string> = {
    classic: C.cyan,
    hardcore: C.pink,
    zen: C.purple,
    speed: C.gold,
    mirror: "#00BFFF",
    dual: "#FF8C00",
    chaos: "#FF00FF",
};

async function loadBestAnyMode(): Promise<number> {
    const keys = [
        "ringlock_best",
        "ringlock_best_hardcore",
        "ringlock_best_zen",
        "ringlock_best_speed",
        "ringlock_best_mirror",
        "ringlock_best_dual",
        "ringlock_best_chaos",
    ];
    const vals = await Promise.all(keys.map((k) => AsyncStorage.getItem(k)));
    return Math.max(0, ...vals.map((v) => (v ? parseInt(v, 10) : 0)));
}

async function loadAdUnlocks(): Promise<Set<string>> {
    const keys = MODE_ORDER.filter((m) => GAME_MODES[m].unlockByAd);
    const vals = await Promise.all(keys.map((k) => AsyncStorage.getItem(AD_UNLOCK_PREFIX + k)));
    const set = new Set<string>();
    keys.forEach((k, i) => { if (vals[i] === "1") set.add(k); });
    return set;
}

export function ModeSelect({
    onSelect,
    onBack,
}: {
    onSelect: (mode: GameMode) => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    const [bestAny, setBestAny] = useState<number | null>(null);
    const [adUnlocked, setAdUnlocked] = useState<Set<string>>(new Set());

    const modeDescKey: Record<string, string> = {
        classic: "classicDesc", hardcore: "hardcoreDesc", zen: "zenDesc",
        speed: "speedDesc", mirror: "mirrorDesc", dual: "dualDesc",
        chaos: "chaosDesc",
    };
    const modeLabelKey: Record<string, string> = {
        classic: "classicLabel", hardcore: "hardcoreLabel", zen: "zenLabel",
        speed: "speedLabel", mirror: "mirrorLabel", dual: "dualLabel",
        chaos: "chaosLabel",
    };

    useEffect(() => {
        loadBestAnyMode().then(setBestAny);
        loadAdUnlocks().then(setAdUnlocked);
    }, []);

    const isUnlocked = (key: GameMode): boolean => {
        const cfg = GAME_MODES[key];
        if (adUnlocked.has(key)) return true;
        if (!cfg.unlockScore && !cfg.unlockByAd) return true;
        if (cfg.unlockScore && bestAny !== null && bestAny >= cfg.unlockScore) return true;
        return false;
    };

    const canUnlockByAd = (key: GameMode): boolean => {
        const cfg = GAME_MODES[key];
        return !!cfg.unlockByAd && !isUnlocked(key);
    };

    const handleAdUnlock = (key: GameMode) => {
        showRewarded(
            () => {
                // Reklam izlendi — modu kalici olarak ac
                AsyncStorage.setItem(AD_UNLOCK_PREFIX + key, "1");
                setAdUnlocked((prev) => new Set(prev).add(key));
            },
            () => { /* kapandi */ }
        );
    };

    return (
        <View style={[StyleSheet.absoluteFill, s.wrap]}>
            <Text style={s.title}>{t("selectMode")}</Text>
            <View style={s.separator} />

            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.modesContainer}
                showsVerticalScrollIndicator={false}
            >
                {MODE_ORDER.map((key) => {
                    const mode = GAME_MODES[key];
                    const color = MODE_COLORS[key];
                    const unlocked = isUnlocked(key);
                    const showAdBtn = canUnlockByAd(key);

                    return (
                        <Pressable
                            key={key}
                            accessibilityRole="button"
                            accessibilityLabel={unlocked ? `Play ${mode.label}` : `${mode.label} locked`}
                            onPress={() => {
                                if (unlocked) onSelect(key);
                                else if (showAdBtn && isRewardedReady()) handleAdUnlock(key);
                            }}
                            style={({ pressed }) => [
                                s.modeBtn,
                                {
                                    borderColor: unlocked ? color : "rgba(255,255,255,0.12)",
                                    opacity: unlocked ? (pressed ? 0.65 : 1) : 0.6,
                                },
                            ]}
                        >
                            <View style={s.modeHeader}>
                                <Text style={[s.modeLabel, { color: unlocked ? color : "rgba(255,255,255,0.3)" }]}>
                                    {t(modeLabelKey[key])}
                                </Text>
                                {!unlocked && (
                                    <Text style={s.lockIcon}>🔒</Text>
                                )}
                            </View>
                            <Text style={[s.modeDesc, { color: unlocked ? `${color}99` : "rgba(255,255,255,0.2)" }]}>
                                {unlocked
                                    ? t(modeDescKey[key])
                                    : showAdBtn
                                        ? t("watchAdUnlock")
                                        : t("unlockWith", { score: mode.unlockScore })}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to Menu"
                onPress={onBack}
                style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.5 }]}
            >
                <Text style={s.backText}>{t("back")}</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: C.overlayBg,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        letterSpacing: 6,
        color: C.cyan,
        marginBottom: 16,
        marginTop: 20,
    },
    separator: {
        width: 80,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.22)",
        marginBottom: 20,
    },
    scroll: {
        width: "100%",
        flexGrow: 0,
    },
    modesContainer: {
        gap: 12,
        width: "80%",
        maxWidth: 300,
        alignSelf: "center",
        paddingBottom: 8,
    },
    modeBtn: {
        borderWidth: 1.5,
        borderRadius: 4,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    modeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    modeLabel: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 15,
        letterSpacing: 4,
    },
    lockIcon: {
        fontSize: 13,
    },
    modeDesc: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 1.5,
        textAlign: "center",
    },
    backBtn: {
        marginTop: 20,
        marginBottom: 24,
        paddingVertical: 10,
        paddingHorizontal: 30,
    },
    backText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 13,
        letterSpacing: 4,
        color: C.subtleText,
    },
});
