import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    interpolate,
} from "react-native-reanimated";
import { C } from "@/constants/game";
import { useTranslation } from "react-i18next";

// ─── Subtle rotating rings ───────────────────────────────────────────────────
function DecoRings() {
    const pulse = useSharedValue(0);
    const rot = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.ease) })
            ),
            -1
        );
        rot.value = withRepeat(
            withTiming(360, { duration: 24000, easing: Easing.linear }),
            -1
        );
    }, []);

    const outerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulse.value, [0, 1], [0.03, 0.09]),
        transform: [{ rotate: `${rot.value}deg` }],
    }));

    const innerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulse.value, [0, 1], [0.05, 0.13]),
        transform: [{ rotate: `${-rot.value * 0.6}deg` }],
    }));

    return (
        <View style={dr.wrap} pointerEvents="none">
            <Animated.View style={[dr.ring, dr.outer, outerStyle]} />
            <Animated.View style={[dr.ring, dr.inner, innerStyle]} />
        </View>
    );
}

const dr = StyleSheet.create({
    wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
    ring: { position: "absolute", borderRadius: 999 },
    outer: { width: 220, height: 220, borderWidth: 1, borderColor: C.purple, borderStyle: "dashed" },
    inner: { width: 130, height: 130, borderWidth: 1.5, borderColor: C.pink },
});

// ─── Fade-in ─────────────────────────────────────────────────────────────────
function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
    const opacity = useSharedValue(0);
    const ty = useSharedValue(16);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }));
        ty.value = withDelay(delay, withTiming(0, { duration: 550, easing: Easing.out(Easing.quad) }));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: ty.value }],
    }));

    return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Main Menu ───────────────────────────────────────────────────────────────
export function MainMenu({
    onPlay,
    onAchievements,
    onScores,
    onSettings,
    onTheme,
    onDailyChallenge,
    bestScore,
    topPad,
    botPad,
}: {
    onPlay: () => void;
    onAchievements: () => void;
    onScores: () => void;
    onSettings: () => void;
    onTheme: () => void;
    onDailyChallenge: () => void;
    bestScore: number;
    topPad: number;
    botPad: number;
}) {
    const { t } = useTranslation();

    return (
        <View style={[StyleSheet.absoluteFill, s.wrap]}>
            <DecoRings />

            <View style={[s.content, { paddingTop: topPad + 60, paddingBottom: botPad + 16 }]}>

                {/* Title */}
                <FadeIn delay={0}>
                    <View style={s.titleGroup}>
                        <Text style={s.title}>{t("appTitle")}</Text>
                        <View style={s.tagRow}>
                            <View style={s.tagLine} />
                            <Text style={s.tagText}>{t("subtitle")}</Text>
                            <View style={s.tagLine} />
                        </View>
                    </View>
                </FadeIn>

                {/* Top stats row: Achievements & Scores */}
                <FadeIn delay={100}>
                    <View style={s.topStatsRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="View Achievements"
                            onPress={onAchievements}
                            style={({ pressed }) => [s.topStatBtn, pressed && { opacity: 0.6 }]}
                        >
                            <Text style={s.topStatEmoji}>🏅</Text>
                            <Text style={[s.topStatLabel, { color: C.gold }]}>{t("achievements")}</Text>
                        </Pressable>

                        <View style={s.topStatDivider} />

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="View Scores"
                            onPress={onScores}
                            style={({ pressed }) => [s.topStatBtn, pressed && { opacity: 0.6 }]}
                        >
                            <Text style={s.topStatEmoji}>🏆</Text>
                            <Text style={[s.topStatLabel, { color: C.cyan }]}>{t("scores")}</Text>
                        </Pressable>
                    </View>
                </FadeIn>

                <View style={s.spacer} />

                {/* Play button */}
                <FadeIn delay={200}>
                    <View style={s.playGroup}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Play Game"
                            onPress={onPlay}
                            style={({ pressed }) => [s.playBtn, pressed && s.playPressed]}
                        >
                            <View style={s.playBg}>
                                <Text style={s.playText}>{t("play")}</Text>
                            </View>
                            <View style={[s.c, s.cTL]} />
                            <View style={[s.c, s.cTR]} />
                            <View style={[s.c, s.cBL]} />
                            <View style={[s.c, s.cBR]} />
                        </Pressable>

                        {bestScore > 0 && (
                            <View style={s.bestRow}>
                                <View style={s.bestDot} />
                                <Text style={s.bestText}>{t("bestPrefix", { score: bestScore })}</Text>
                                <View style={s.bestDot} />
                            </View>
                        )}
                    </View>
                </FadeIn>

                <View style={s.spacer} />

                {/* Bottom: Themes, Daily Challenge, Settings */}
                <View style={s.bottomGroup}>
                    <FadeIn delay={300}>
                        <View style={s.iconRow}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Open Themes"
                                onPress={onTheme}
                                style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]}
                            >
                                <Text style={s.iconEmoji}>🎨</Text>
                                <Text style={[s.iconLabel, { color: C.purple }]}>{t("themes")}</Text>
                            </Pressable>

                            <View style={s.iconDivider} />

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Daily Challenge"
                                onPress={onDailyChallenge}
                                style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]}
                            >
                                <Text style={s.iconEmoji}>🎯</Text>
                                <Text style={[s.iconLabel, { color: C.gold }]}>{t("dailyChallenge")}</Text>
                            </Pressable>

                            <View style={s.iconDivider} />

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Open Settings"
                                onPress={onSettings}
                                style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]}
                            >
                                <Text style={s.iconEmoji}>⚙️</Text>
                                <Text style={[s.iconLabel, { color: C.subtleText }]}>{t("settings")}</Text>
                            </Pressable>
                        </View>
                    </FadeIn>

                    <FadeIn delay={420}>
                        <View style={s.hintBlock}>
                            <View style={s.hintLine} />
                            <Text style={s.hintText}>{t("hint")}</Text>
                            <View style={s.hintLine} />
                        </View>
                    </FadeIn>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {},
    content: { flex: 1, alignItems: "center" },

    // ── Title ──
    titleGroup: { alignItems: "center" },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 38,
        letterSpacing: 12,
        color: C.cyan,
        marginBottom: 14,
    },
    tagRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    tagLine: { width: 22, height: 1, backgroundColor: "rgba(0,255,232,0.22)" },
    tagText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 8, letterSpacing: 5,
        color: "rgba(0,255,232,0.38)",
    },

    // ── Top Stats ──
    topStatsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 32,
        borderWidth: 1,
        borderColor: "rgba(0,255,232,0.08)",
        borderRadius: 6,
        backgroundColor: "rgba(0,255,232,0.02)",
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 0,
    },
    topStatBtn: {
        alignItems: "center",
        paddingHorizontal: 24,
        gap: 7,
    },
    topStatEmoji: {
        fontSize: 22,
    },
    topStatLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 8,
        letterSpacing: 3,
    },
    topStatDivider: {
        width: StyleSheet.hairlineWidth,
        height: 30,
        backgroundColor: "rgba(0,255,232,0.12)",
    },

    spacer: { flex: 1 },

    // ── Play ──
    playGroup: { alignItems: "center" },
    playBtn: {
        borderWidth: 1.5, borderColor: C.cyan, borderRadius: 4,
    },
    playPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    playBg: { paddingHorizontal: 64, paddingVertical: 22, backgroundColor: "rgba(0,255,232,0.05)" },
    playText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 28, letterSpacing: 14, color: C.cyan,
    },
    c: { position: "absolute", width: 10, height: 10, borderColor: C.cyan },
    cTL: { top: -1.5, left: -1.5, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
    cTR: { top: -1.5, right: -1.5, borderTopWidth: 2.5, borderRightWidth: 2.5 },
    cBL: { bottom: -1.5, left: -1.5, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
    cBR: { bottom: -1.5, right: -1.5, borderBottomWidth: 2.5, borderRightWidth: 2.5 },

    bestRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 },
    bestDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(0,255,232,0.25)" },
    bestText: { fontFamily: "Orbitron_400Regular", fontSize: 11, letterSpacing: 4, color: C.subtleText },

    // ── Bottom ──
    bottomGroup: { alignItems: "center", gap: 20 },

    // Icon buttons row
    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(0,255,232,0.08)",
        borderRadius: 6,
        backgroundColor: "rgba(0,255,232,0.02)",
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    iconBtn: {
        alignItems: "center",
        paddingHorizontal: 22,
        gap: 7,
    },
    iconEmoji: {
        fontSize: 22,
    },
    iconLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 8,
        letterSpacing: 3,
    },
    iconDivider: {
        width: StyleSheet.hairlineWidth,
        height: 28,
        backgroundColor: "rgba(0,255,232,0.1)",
    },

    // Hint
    hintBlock: { flexDirection: "row", alignItems: "center", gap: 14 },
    hintLine: { width: 18, height: 1, backgroundColor: "rgba(0,255,232,0.18)" },
    hintText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9, letterSpacing: 2,
        color: "rgba(0,255,232,0.45)",
        textAlign: "center",
    },
});
