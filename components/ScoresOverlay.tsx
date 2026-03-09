import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C, type GameMode } from "@/constants/game";

const MODES: { key: GameMode; label: string; color: string; icon: string }[] = [
    { key: "classic", label: "CLASSIC", color: C.cyan, icon: "◎" },
    { key: "hardcore", label: "HARDCORE", color: C.pink, icon: "◆" },
    { key: "zen", label: "ZEN", color: C.purple, icon: "○" },
    { key: "speed", label: "SPEED RUSH", color: C.gold, icon: "◈" },
];

function bestKey(mode: GameMode) {
    return mode === "classic" ? "ringlock_best" : `ringlock_best_${mode}`;
}

export function ScoresOverlay({ onClose }: { onClose: () => void }) {
    const [scores, setScores] = useState<Record<GameMode, number>>({
        classic: 0, hardcore: 0, zen: 0, speed: 0,
    });
    const [totalGames, setTotalGames] = useState(0);
    const [totalScore, setTotalScore] = useState(0);

    useEffect(() => {
        // Load all mode best scores
        Promise.all(
            MODES.map(({ key }) =>
                AsyncStorage.getItem(bestKey(key)).then((v) => ({
                    key,
                    score: v ? parseInt(v, 10) : 0,
                }))
            )
        ).then((results) => {
            const s = { classic: 0, hardcore: 0, zen: 0, speed: 0 };
            for (const r of results) s[r.key] = r.score;
            setScores(s);
        });

        // Load lifetime stats
        AsyncStorage.getItem("ringlock_total_games").then((v) => {
            if (v) setTotalGames(parseInt(v, 10));
        });
        AsyncStorage.getItem("ringlock_total_score").then((v) => {
            if (v) setTotalScore(parseInt(v, 10));
        });
    }, []);

    const hasAnyScore = Object.values(scores).some((v) => v > 0);

    return (
        <View style={[StyleSheet.absoluteFill, s.wrap]}>
            {/* Header */}
            <Text style={s.title}>SKORLAR</Text>
            <View style={s.separator} />

            {/* Mode scores */}
            <View style={s.list}>
                {MODES.map(({ key, label, color, icon }) => {
                    const val = scores[key];
                    const active = val > 0;
                    return (
                        <View key={key} style={[s.row, { borderColor: active ? `${color}30` : "rgba(255,255,255,0.04)" }]}>
                            <View style={s.rowLeft}>
                                <Text style={[s.rowIcon, { color: active ? color : "rgba(255,255,255,0.12)" }]}>
                                    {icon}
                                </Text>
                                <View>
                                    <Text style={[s.rowLabel, { color: active ? color : "rgba(255,255,255,0.15)" }]}>
                                        {label}
                                    </Text>
                                    <Text style={s.rowSub}>EN IYI SKOR</Text>
                                </View>
                            </View>
                            <Text style={[s.rowScore, { color: active ? color : "rgba(255,255,255,0.1)" }]}>
                                {active ? val : "—"}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Lifetime stats */}
            {(totalGames > 0 || totalScore > 0) && (
                <View style={s.statsWrap}>
                    <View style={s.statsSep}>
                        <View style={s.statsLine} />
                        <Text style={s.statsHeader}>ISTATISTIKLER</Text>
                        <View style={s.statsLine} />
                    </View>
                    <View style={s.statsRow}>
                        <View style={s.statItem}>
                            <Text style={s.statValue}>{totalGames}</Text>
                            <Text style={s.statLabel}>OYUN</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statItem}>
                            <Text style={s.statValue}>{totalScore}</Text>
                            <Text style={s.statLabel}>TOPLAM SKOR</Text>
                        </View>
                    </View>
                </View>
            )}

            {!hasAnyScore && (
                <View style={s.emptyWrap}>
                    <Text style={s.emptyText}>HENUZ SKOR YOK</Text>
                    <Text style={s.emptyHint}>Bir oyun oynayarak basla!</Text>
                </View>
            )}

            {/* Close */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Scores"
                onPress={onClose}
                style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            >
                <Text style={s.closeText}>KAPAT</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        backgroundColor: C.overlayBg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 20,
        letterSpacing: 8,
        color: C.cyan,
        marginBottom: 6,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.cyan,
                textShadowRadius: 14,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    separator: {
        width: 60,
        height: 1.5,
        backgroundColor: "rgba(0,255,232,0.2)",
        borderRadius: 1,
        marginBottom: 28,
    },

    list: {
        width: "100%",
        gap: 10,
        marginBottom: 24,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: "rgba(255,255,255,0.015)",
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rowIcon: {
        fontSize: 18,
    },
    rowLabel: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 12,
        letterSpacing: 3,
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
        fontSize: 24,
    },

    // Stats
    statsWrap: {
        width: "100%",
        marginBottom: 24,
    },
    statsSep: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
    },
    statsLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(0,255,232,0.08)",
    },
    statsHeader: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 5,
        color: "rgba(0,255,232,0.25)",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,255,232,0.08)",
        borderRadius: 6,
        backgroundColor: "rgba(0,255,232,0.015)",
        paddingVertical: 14,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontFamily: "Orbitron_900Black",
        fontSize: 20,
        color: C.cyan,
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 3,
        color: C.subtleText,
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        height: 28,
        backgroundColor: "rgba(0,255,232,0.1)",
    },

    // Empty
    emptyWrap: {
        alignItems: "center",
        marginBottom: 24,
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

    // Close
    closeBtn: {
        paddingVertical: 10,
        paddingHorizontal: 30,
    },
    closeText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 13,
        letterSpacing: 4,
        color: C.subtleText,
    },
});
