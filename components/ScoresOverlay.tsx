import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from "react-native-reanimated";
import { C, type GameMode } from "@/constants/game";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.min(SW - 32, 360);

const MODES: { key: GameMode; label: string; color: string; icon: string }[] = [
    { key: "classic", label: "CLASSIC", color: C.cyan, icon: "◎" },
    { key: "hardcore", label: "HARDCORE", color: C.pink, icon: "◆" },
    { key: "zen", label: "ZEN", color: C.purple, icon: "○" },
    { key: "speed", label: "SPEED RUSH", color: C.gold, icon: "◈" },
];

function bestKey(mode: GameMode) {
    return mode === "classic" ? "ringlock_best" : `ringlock_best_${mode}`;
}

interface Stats {
    scores: Record<GameMode, number>;
    totalGames: number;
    totalScore: number;
    bestCombo: number;
    streak: number;
    dailyCompleted: number;
}

async function loadStats(): Promise<Stats> {
    const modeScores = await Promise.all(
        MODES.map(({ key }) =>
            AsyncStorage.getItem(bestKey(key)).then((v) => ({
                key,
                score: v ? parseInt(v, 10) : 0,
            }))
        )
    );
    const scores = { classic: 0, hardcore: 0, zen: 0, speed: 0 } as Record<GameMode, number>;
    for (const r of modeScores) scores[r.key] = r.score;

    const [games, score, combo, streak, daily] = await Promise.all([
        AsyncStorage.getItem("ringlock_total_games"),
        AsyncStorage.getItem("ringlock_total_score"),
        AsyncStorage.getItem("ringlock_best_combo"),
        AsyncStorage.getItem("ringlock_streak"),
        AsyncStorage.getItem("ringlock_daily_completed_count"),
    ]);

    return {
        scores,
        totalGames: games ? parseInt(games, 10) : 0,
        totalScore: score ? parseInt(score, 10) : 0,
        bestCombo: combo ? parseInt(combo, 10) : 0,
        streak: streak ? parseInt(streak, 10) : 0,
        dailyCompleted: daily ? parseInt(daily, 10) : 0,
    };
}

function PulsingBadge({ color, children }: { color: string; children: React.ReactNode }) {
    const glow = useSharedValue(0);
    useEffect(() => {
        glow.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
            ),
            -1
        );
    }, []);
    const style = useAnimatedStyle(() => ({
        opacity: 0.5 + glow.value * 0.5,
    }));
    return (
        <Animated.View style={[{ borderRadius: 999, borderWidth: 1, borderColor: color, padding: 6 }, style]}>
            {children}
        </Animated.View>
    );
}

function StatCard({
    label, value, sub, color, emoji,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
    emoji?: string;
}) {
    const c = color ?? C.cyan;
    return (
        <View style={[sc.statCard, { borderColor: `${c}22` }]}>
            {emoji ? <Text style={sc.statEmoji}>{emoji}</Text> : null}
            <Text style={[sc.statValue, { color: c }]}>{value}</Text>
            <Text style={sc.statLabel}>{label}</Text>
            {sub ? <Text style={sc.statSub}>{sub}</Text> : null}
        </View>
    );
}

export function ScoresOverlay({ onClose }: { onClose: () => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
        loadStats().then(setStats);
    }, []);

    const wrapStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    function handleClose() {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onClose, 220);
    }

    const hasAnyScore = stats ? Object.values(stats.scores).some((v) => v > 0) : false;
    const avgScore = stats && stats.totalGames > 0
        ? Math.round(stats.totalScore / stats.totalGames)
        : 0;

    const topMode = stats
        ? MODES.reduce((best, m) =>
            stats.scores[m.key] > (best ? stats.scores[best.key] : -1) ? m : best,
            null as typeof MODES[0] | null
        )
        : null;

    return (
        <Animated.View style={[StyleSheet.absoluteFill, sc.wrap, wrapStyle]}>
            <Text style={sc.title}>İSTATİSTİKLER</Text>
            <View style={sc.separator} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={sc.scroll}
            >
                {/* Mode Best Scores */}
                <Text style={sc.sectionLabel}>MOD EN İYİ SKORLAR</Text>
                <View style={sc.list}>
                    {MODES.map(({ key, label, color, icon }) => {
                        const val = stats?.scores[key] ?? 0;
                        const active = val > 0;
                        const isBest = topMode?.key === key && active;
                        return (
                            <View
                                key={key}
                                style={[sc.row, {
                                    borderColor: active ? `${color}30` : "rgba(255,255,255,0.04)",
                                    backgroundColor: isBest ? `${color}08` : "rgba(255,255,255,0.015)",
                                }]}
                            >
                                <View style={sc.rowLeft}>
                                    <Text style={[sc.rowIcon, { color: active ? color : "rgba(255,255,255,0.12)" }]}>
                                        {icon}
                                    </Text>
                                    <View>
                                        <Text style={[sc.rowLabel, { color: active ? color : "rgba(255,255,255,0.15)" }]}>
                                            {label}
                                        </Text>
                                        <Text style={sc.rowSub}>{isBest ? "★ EN İYİ MOD" : "EN İYİ SKOR"}</Text>
                                    </View>
                                </View>
                                <Text style={[sc.rowScore, { color: active ? color : "rgba(255,255,255,0.1)" }]}>
                                    {active ? val : "—"}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Lifetime stats grid */}
                {stats && stats.totalGames > 0 && (
                    <>
                        <Text style={[sc.sectionLabel, { marginTop: 20 }]}>YAŞAM BOYU İSTATİSTİKLER</Text>
                        <View style={sc.statGrid}>
                            <StatCard
                                label="OYUN"
                                value={stats.totalGames}
                                emoji="🎮"
                                color={C.cyan}
                            />
                            <StatCard
                                label="TOPLAM SKOR"
                                value={stats.totalScore}
                                emoji="⭐"
                                color={C.gold}
                            />
                            <StatCard
                                label="ORT. SKOR"
                                value={avgScore}
                                sub="oyun başına"
                                emoji="📊"
                                color={C.purple}
                            />
                            <StatCard
                                label="EN İYİ KOMBO"
                                value={stats.bestCombo > 0 ? `${stats.bestCombo}x` : "—"}
                                emoji="🔗"
                                color={C.pink}
                            />
                            <StatCard
                                label="GÜN SERİSİ"
                                value={stats.streak > 0 ? `${stats.streak}🔥` : "—"}
                                emoji=""
                                color={C.gold}
                            />
                            <StatCard
                                label="GÜNLÜK GÖREV"
                                value={stats.dailyCompleted > 0 ? stats.dailyCompleted : "—"}
                                sub="tamamlandı"
                                emoji="🎯"
                                color={C.cyan}
                            />
                        </View>
                    </>
                )}

                {!hasAnyScore && (
                    <View style={sc.emptyWrap}>
                        <Text style={sc.emptyText}>HENÜZ SKOR YOK</Text>
                        <Text style={sc.emptyHint}>Bir oyun oynayarak başla!</Text>
                    </View>
                )}
            </ScrollView>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Scores"
                onPress={handleClose}
                style={({ pressed }) => [sc.closeBtn, pressed && { opacity: 0.6 }]}
            >
                <Text style={sc.closeText}>KAPAT</Text>
            </Pressable>
        </Animated.View>
    );
}

const HALF = (CARD_W - 12) / 2;

const sc = StyleSheet.create({
    wrap: {
        backgroundColor: C.overlayBg,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 60,
        paddingHorizontal: 16,
        zIndex: 100,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 20,
        letterSpacing: 6,
        color: C.cyan,
        marginBottom: 6,
        ...(Platform.OS === "ios"
            ? { textShadowColor: C.cyan, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } }
            : {}),
    },
    separator: {
        width: 60,
        height: 1.5,
        backgroundColor: "rgba(0,255,232,0.2)",
        borderRadius: 1,
        marginBottom: 20,
    },
    scroll: {
        width: CARD_W,
        paddingBottom: 20,
        alignItems: "flex-start",
    },
    sectionLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 4,
        color: "rgba(0,255,232,0.35)",
        marginBottom: 10,
    },
    list: {
        width: CARD_W,
        gap: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    rowIcon: { fontSize: 16 },
    rowLabel: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 2,
    },
    rowSub: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.15)",
    },
    rowScore: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
    },

    statGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        width: CARD_W,
    },
    statCard: {
        width: HALF,
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.02)",
        paddingVertical: 16,
        paddingHorizontal: 14,
        alignItems: "flex-start",
        gap: 4,
    },
    statEmoji: { fontSize: 18, marginBottom: 4 },
    statValue: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        lineHeight: 26,
    },
    statLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 3,
        color: "rgba(255,255,255,0.3)",
    },
    statSub: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.18)",
    },

    emptyWrap: {
        alignItems: "center",
        width: CARD_W,
        marginVertical: 24,
    },
    emptyText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 12,
        letterSpacing: 4,
        color: "rgba(255,255,255,0.15)",
        marginBottom: 6,
    },
    emptyHint: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        color: "rgba(255,255,255,0.1)",
    },

    closeBtn: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 36,
        borderWidth: 1,
        borderColor: "rgba(0,255,232,0.2)",
        borderRadius: 4,
    },
    closeText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 13,
        letterSpacing: 4,
        color: C.subtleText,
    },
});
