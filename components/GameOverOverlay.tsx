import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Share, Dimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    withRepeat,
    Easing,
    interpolate,
} from "react-native-reanimated";
import { C, GameMode, GAME_MODES } from "@/constants/game";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 48;

const MODE_COLORS: Record<GameMode, string> = {
    classic: C.cyan,
    hardcore: C.pink,
    zen: C.purple,
    speed: C.gold,
};

/* ─── Animated helpers ───────────────────────────────────────────────── */

function FadeSlide({ delay, children }: { delay: number; children: React.ReactNode }) {
    const p = useSharedValue(0);
    useEffect(() => {
        p.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    }, []);
    const style = useAnimatedStyle(() => ({
        opacity: p.value,
        transform: [{ translateY: interpolate(p.value, [0, 1], [20, 0]) }],
    }));
    return <Animated.View style={style}>{children}</Animated.View>;
}

function ScoreRing({ color }: { color: string }) {
    const rot = useSharedValue(0);
    const opacity = useSharedValue(0);
    useEffect(() => {
        opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
        rot.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    }, []);
    const outer = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ rotate: `${rot.value}deg` }],
    }));
    const inner = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ rotate: `-${rot.value * 0.6}deg` }],
    }));
    return (
        <>
            <Animated.View style={[s.scoreRing, s.scoreRingOuter, { borderColor: `${color}15` }, outer]} />
            <Animated.View style={[s.scoreRing, s.scoreRingInner, { borderColor: `${color}25` }, inner]} />
        </>
    );
}

function ScoreReveal({ value, color }: { value: number; color: string }) {
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0);
    useEffect(() => {
        opacity.value = withDelay(250, withTiming(1, { duration: 350 }));
        scale.value = withDelay(250, withSequence(
            withTiming(1.08, { duration: 350, easing: Easing.out(Easing.back(2)) }),
            withTiming(1, { duration: 200 })
        ));
    }, []);
    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));
    return (
        <Animated.View style={[s.scoreCenter, style]}>
            <Text style={[s.bigScore, { color }]}>{value}</Text>
            <Text style={s.scoreUnit}>PUAN</Text>
        </Animated.View>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────── */

export function GameOverOverlay({
    score,
    bestScore,
    maxCombo,
    gameMode = "classic",
    onRestart,
    onMenu,
}: {
    score: number;
    bestScore: number;
    maxCombo?: number;
    gameMode?: GameMode;
    onRestart: () => void;
    onMenu: () => void;
}) {
    const bg = useSharedValue(0);
    useEffect(() => {
        bg.value = withTiming(1, { duration: 500 });
    }, []);
    const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value }));

    const modeColor = MODE_COLORS[gameMode];
    const isNewBest = score > 0 && score >= bestScore;

    return (
        <Animated.View style={[StyleSheet.absoluteFill, s.overlay, bgStyle]}>
            <View style={s.container}>

                {/* ── Header ── */}
                <FadeSlide delay={0}>
                    <Text style={s.titleText}>OYUN BITTI</Text>
                </FadeSlide>

                {/* ── Mode pill ── */}
                <FadeSlide delay={80}>
                    <View style={[s.modePill, { backgroundColor: `${modeColor}12`, borderColor: `${modeColor}30` }]}>
                        <View style={[s.modeDot, { backgroundColor: modeColor }]} />
                        <Text style={[s.modeText, { color: modeColor }]}>
                            {GAME_MODES[gameMode].label}
                        </Text>
                    </View>
                </FadeSlide>

                {/* ── Score circle area ── */}
                <View style={s.scoreArea}>
                    <ScoreRing color={modeColor} />
                    <ScoreReveal value={score} color={modeColor} />
                </View>

                {/* ── New record ── */}
                {isNewBest && (
                    <FadeSlide delay={500}>
                        <View style={s.newRecordWrap}>
                            <Text style={s.newRecordStar}>★</Text>
                            <Text style={s.newRecordLabel}>YENI REKOR</Text>
                            <Text style={s.newRecordStar}>★</Text>
                        </View>
                    </FadeSlide>
                )}

                {/* ── Stats card ── */}
                <FadeSlide delay={550}>
                    <View style={s.statsCard}>
                        <View style={s.statItem}>
                            <Text style={s.statIcon}>🏆</Text>
                            <View>
                                <Text style={s.statValue}>{bestScore}</Text>
                                <Text style={s.statKey}>EN IYI SKOR</Text>
                            </View>
                        </View>
                        {maxCombo != null && maxCombo > 1 && (
                            <>
                                <View style={s.statDivider} />
                                <View style={s.statItem}>
                                    <Text style={s.statIcon}>🔥</Text>
                                    <View>
                                        <Text style={s.statValue}>{maxCombo}x</Text>
                                        <Text style={s.statKey}>MAKS KOMBO</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </FadeSlide>

                {/* ── Buttons ── */}
                <FadeSlide delay={700}>
                    <View style={s.btnsArea}>
                        {/* Primary */}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Restart Game"
                            onPress={onRestart}
                            style={({ pressed }) => [
                                s.primaryBtn,
                                { backgroundColor: modeColor },
                                pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                            ]}
                        >
                            <Text style={s.primaryBtnIcon}>↻</Text>
                            <Text style={s.primaryBtnText}>TEKRAR OYNA</Text>
                        </Pressable>

                        {/* Secondary row */}
                        <View style={s.secRow}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Share Score"
                                onPress={() => {
                                    const mt = gameMode !== "classic" ? ` [${GAME_MODES[gameMode].label}]` : "";
                                    const ct = maxCombo && maxCombo > 1 ? ` | Kombo: ${maxCombo}x` : "";
                                    Share.share({ message: `RingLock${mt} - ${score} puan!${ct} Sen de dene!` });
                                }}
                                style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.6 }]}
                            >
                                <Text style={s.secBtnIcon}>↗</Text>
                                <Text style={s.secBtnText}>PAYLAS</Text>
                            </Pressable>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Return to Main Menu"
                                onPress={onMenu}
                                style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.6 }]}
                            >
                                <Text style={s.secBtnIcon}>⌂</Text>
                                <Text style={s.secBtnText}>ANA MENU</Text>
                            </Pressable>
                        </View>
                    </View>
                </FadeSlide>
            </View>
        </Animated.View>
    );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */

const RING_SIZE = 180;

const s = StyleSheet.create({
    overlay: {
        backgroundColor: "#030310",
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 16,
    },

    // Title
    titleText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 20,
        letterSpacing: 10,
        color: "#fff",
        marginBottom: 2,
    },

    // Mode pill
    modePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
    },
    modeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    modeText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 9,
        letterSpacing: 4,
    },

    // Score area (circle)
    scoreArea: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 8,
    },
    scoreRing: {
        position: "absolute",
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderRadius: 999,
    },
    scoreRingOuter: {
        width: RING_SIZE,
        height: RING_SIZE,
    },
    scoreRingInner: {
        width: RING_SIZE - 28,
        height: RING_SIZE - 28,
    },
    scoreCenter: {
        alignItems: "center",
    },
    bigScore: {
        fontFamily: "Orbitron_900Black",
        fontSize: 64,
        lineHeight: 72,
    },
    scoreUnit: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 8,
        color: "rgba(255,255,255,0.3)",
        marginTop: 2,
    },

    // New record
    newRecordWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    newRecordStar: {
        fontSize: 14,
        color: C.gold,
    },
    newRecordLabel: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 12,
        letterSpacing: 4,
        color: C.gold,
    },

    // Stats card
    statsCard: {
        width: CARD_W,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    statIcon: {
        fontSize: 22,
    },
    statValue: {
        fontFamily: "Orbitron_900Black",
        fontSize: 18,
        color: "#fff",
    },
    statKey: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.35)",
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginHorizontal: 10,
    },

    // Buttons
    btnsArea: {
        width: CARD_W,
        gap: 10,
        marginTop: 6,
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        borderRadius: 12,
        paddingVertical: 18,
    },
    primaryBtnIcon: {
        fontSize: 18,
        color: "#030310",
        fontWeight: "800",
    },
    primaryBtnText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 14,
        letterSpacing: 3,
        color: "#030310",
    },
    secRow: {
        flexDirection: "row",
        gap: 10,
    },
    secBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        paddingVertical: 14,
        backgroundColor: "rgba(255,255,255,0.03)",
    },
    secBtnIcon: {
        fontSize: 14,
        color: "rgba(255,255,255,0.5)",
    },
    secBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 10,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.6)",
    },
});
