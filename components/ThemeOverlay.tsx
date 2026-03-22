import React, { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, Pressable, ScrollView, Dimensions,
} from "react-native";
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { C } from "@/constants/game";
import {
    RING_THEMES, BG_THEMES, isThemeUnlocked, useTheme, RingTheme, BgTheme,
} from "@/lib/ThemeContext";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.min(SW - 48, 340);
const ITEM_W = (CARD_W - 20) / 3 - 8;

interface UnlockStats {
    bestScore: number;
    totalGames: number;
}

async function loadStats(): Promise<UnlockStats> {
    const [bestRaw, gamesRaw] = await Promise.all([
        AsyncStorage.getItem("ringlock_best"),
        AsyncStorage.getItem("ringlock_total_games"),
    ]);
    const classic = bestRaw ? parseInt(bestRaw, 10) : 0;
    const all: number[] = await Promise.all(
        ["hardcore", "zen", "speed"].map(async (m) => {
            const v = await AsyncStorage.getItem(`ringlock_best_${m}`);
            return v ? parseInt(v, 10) : 0;
        })
    );
    return {
        bestScore: Math.max(classic, ...all),
        totalGames: gamesRaw ? parseInt(gamesRaw, 10) : 0,
    };
}

function RingThemeCard({
    theme,
    isActive,
    isUnlocked,
    onPress,
    translatedName,
}: {
    theme: RingTheme;
    isActive: boolean;
    isUnlocked: boolean;
    onPress: () => void;
    translatedName: string;
}) {
    const { t } = useTranslation();
    return (
        <Pressable
            onPress={isUnlocked ? onPress : undefined}
            style={({ pressed }) => [
                tc.themeCard,
                { width: ITEM_W, borderColor: isActive ? theme.color : "rgba(255,255,255,0.07)" },
                isActive && { backgroundColor: `${theme.color}12` },
                pressed && isUnlocked && { opacity: 0.75 },
                !isUnlocked && { opacity: 0.4 },
            ]}
        >
            <View style={[tc.colorDot, { backgroundColor: isUnlocked ? theme.color : "#555", borderColor: isUnlocked ? theme.borderGlow : "transparent" }]} />
            <Text style={[tc.cardName, isActive && { color: theme.color }]}>{theme.emoji}</Text>
            <Text style={[tc.cardLabel, isActive && { color: theme.color }]} numberOfLines={1}>
                {translatedName}
            </Text>
            {!isUnlocked && <Text style={tc.lockIcon}>🔒</Text>}
            {isActive && <Text style={[tc.activeTag, { color: theme.color }]}>{t("active")}</Text>}
        </Pressable>
    );
}

function BgThemeCard({
    theme,
    isActive,
    isUnlocked,
    onPress,
    translatedName,
}: {
    theme: BgTheme;
    isActive: boolean;
    isUnlocked: boolean;
    onPress: () => void;
    translatedName: string;
}) {
    const { t } = useTranslation();
    return (
        <Pressable
            onPress={isUnlocked ? onPress : undefined}
            style={({ pressed }) => [
                tc.themeCard,
                { width: ITEM_W, borderColor: isActive ? theme.accentColor : "rgba(255,255,255,0.07)" },
                isActive && { backgroundColor: `${theme.accentColor}10` },
                pressed && isUnlocked && { opacity: 0.75 },
                !isUnlocked && { opacity: 0.4 },
            ]}
        >
            <View style={[tc.bgPreview, {
                backgroundColor: theme.colors[1],
                borderColor: isUnlocked ? theme.accentColor : "#555",
            }]} />
            <Text style={tc.cardLabel2}>{theme.emoji}</Text>
            <Text style={[tc.cardLabel, isActive && { color: theme.accentColor }]} numberOfLines={1}>
                {translatedName}
            </Text>
            {!isUnlocked && <Text style={tc.lockIcon}>🔒</Text>}
            {isActive && <Text style={[tc.activeTag, { color: theme.accentColor }]}>{t("active")}</Text>}
        </Pressable>
    );
}

export function ThemeOverlay({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const { activeRingId, activeBgId, setRingTheme, setBgTheme } = useTheme();
    const [stats, setStats] = useState<UnlockStats>({ bestScore: 0, totalGames: 0 });
    const opacity = useSharedValue(0);

    const themeNameKeys: Record<string, string> = {
        pink: "theme.neonPink", cyan: "theme.cyberBlue", gold: "theme.gold",
        purple: "theme.purpleNight", fire: "theme.fire", rainbow: "theme.rainbow",
        space: "theme.space", ocean: "theme.ocean", lava: "theme.lava",
        forest: "theme.forest", galaxy: "theme.galaxy",
    };

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
        loadStats().then(setStats);
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    function handleClose() {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onClose, 220);
    }

    return (
        <Animated.View style={[StyleSheet.absoluteFill, tc.wrap, style]}>
            <View style={tc.container}>
                <Text style={tc.title}>{t("themesTitle")}</Text>
                <View style={tc.sep} />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tc.scroll}
                >
                    {/* Ring Themes */}
                    <Text style={tc.sectionLabel}>{t("ringColor")}</Text>
                    <View style={tc.grid}>
                        {RING_THEMES.map((rt) => (
                            <RingThemeCard
                                key={rt.id}
                                theme={rt}
                                isActive={rt.id === activeRingId}
                                isUnlocked={isThemeUnlocked(rt.unlockKey, stats)}
                                onPress={() => setRingTheme(rt.id)}
                                translatedName={t(themeNameKeys[rt.id])}
                            />
                        ))}
                    </View>

                    {/* Background Themes */}
                    <Text style={[tc.sectionLabel, { marginTop: 20 }]}>{t("backgroundLabel")}</Text>
                    <View style={tc.grid}>
                        {BG_THEMES.map((bt) => (
                            <BgThemeCard
                                key={bt.id}
                                theme={bt}
                                isActive={bt.id === activeBgId}
                                isUnlocked={isThemeUnlocked(bt.unlockKey, stats)}
                                onPress={() => setBgTheme(bt.id)}
                                translatedName={t(themeNameKeys[bt.id])}
                            />
                        ))}
                    </View>

                    <Text style={tc.hint}>
                        {t("themeHint")}
                    </Text>
                </ScrollView>

                <Pressable
                    onPress={handleClose}
                    style={({ pressed }) => [tc.closeBtn, pressed && { opacity: 0.6 }]}
                >
                    <Text style={tc.closeBtnText}>{t("close")}</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const tc = StyleSheet.create({
    wrap: {
        backgroundColor: "rgba(3,3,16,1)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
    },
    container: {
        width: CARD_W,
        maxHeight: "85%",
        alignItems: "center",
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        letterSpacing: 7,
        color: C.cyan,
        marginBottom: 16,
    },
    sep: {
        width: 80,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.2)",
        marginBottom: 20,
    },
    scroll: {
        alignItems: "center",
        paddingBottom: 20,
    },
    sectionLabel: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 9,
        letterSpacing: 4,
        color: C.subtleText,
        marginBottom: 12,
        alignSelf: "flex-start",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        width: CARD_W,
    },
    themeCard: {
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    colorDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
    },
    bgPreview: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 1.5,
    },
    cardName: {
        fontSize: 16,
    },
    cardLabel2: {
        fontSize: 16,
    },
    cardLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.5)",
        textAlign: "center",
    },
    lockIcon: {
        fontSize: 10,
        position: "absolute",
        top: 6,
        right: 6,
    },
    activeTag: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 6,
        letterSpacing: 1,
    },
    hint: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: 1,
        textAlign: "center",
        marginTop: 16,
    },
    closeBtn: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: C.pink,
        borderRadius: 3,
        paddingHorizontal: 36,
        paddingVertical: 12,
    },
    closeBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 4,
        color: C.pink,
    },
});
