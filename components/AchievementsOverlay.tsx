import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { C } from "@/constants/game";
import { ACHIEVEMENTS, getUnlockedAchievements } from "@/lib/achievements";

export function AchievementsOverlay({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const [unlocked, setUnlocked] = useState<string[]>([]);

    const achKeyMap: Record<string, string> = {
        score_10: "score10", score_25: "score25", score_50: "score50", score_100: "score100",
        combo_10: "combo10", combo_25: "combo25", combo_50: "combo50",
        perfect_5: "perfect5", perfect_15: "perfect15", perfect_only: "perfectOnly",
        hardcore_20: "hardcore20", speed_30: "speed30", zen_100: "zen100",
        mirror_15: "mirror15", mirror_30: "mirror30",
        dual_10: "dual10", dual_25: "dual25",
        games_10: "games10", games_50: "games50", total_500: "total500",
    };

    useEffect(() => {
        getUnlockedAchievements().then(setUnlocked);
    }, []);

    const unlockedCount = unlocked.length;
    const totalCount = ACHIEVEMENTS.length;

    return (
        <View style={[StyleSheet.absoluteFill, s.wrap]}>
            <Text style={s.title}>{t("achievements")}</Text>
            <Text style={s.counter}>{unlockedCount} / {totalCount}</Text>
            <View style={s.separator} />

            <ScrollView style={s.list} contentContainerStyle={s.listContent}>
                {ACHIEVEMENTS.map((ach) => {
                    const isUnlocked = unlocked.includes(ach.id);
                    return (
                        <View
                            key={ach.id}
                            style={[s.achItem, !isUnlocked && s.achLocked]}
                        >
                            <Text style={s.achIcon}>{isUnlocked ? ach.icon : "🔒"}</Text>
                            <View style={s.achInfo}>
                                <Text style={[s.achTitle, !isUnlocked && s.achTextLocked]}>
                                    {t(`ach.${achKeyMap[ach.id]}.title`)}
                                </Text>
                                <Text style={[s.achDesc, !isUnlocked && s.achTextLocked]}>
                                    {t(`ach.${achKeyMap[ach.id]}.desc`)}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Achievements"
                onPress={onClose}
                style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            >
                <Text style={s.closeText}>{t("close")}</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        backgroundColor: C.overlayBg,
        alignItems: "center",
        paddingTop: 80,
        paddingBottom: 40,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        letterSpacing: 7,
        color: C.cyan,
        marginBottom: 4,
    },
    counter: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 12,
        letterSpacing: 3,
        color: C.subtleText,
        marginBottom: 12,
    },
    separator: {
        width: 80,
        height: 1,
        backgroundColor: "rgba(255,215,0,0.22)",
        marginBottom: 16,
    },
    list: {
        flex: 1,
        width: "100%",
        paddingHorizontal: 24,
    },
    listContent: {
        gap: 10,
        paddingBottom: 20,
    },
    achItem: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,215,0,0.25)",
        borderRadius: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    achLocked: {
        borderColor: "rgba(255,255,255,0.08)",
    },
    achIcon: {
        fontSize: 22,
    },
    achInfo: {
        flex: 1,
    },
    achTitle: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 12,
        letterSpacing: 3,
        color: C.gold,
        marginBottom: 2,
    },
    achDesc: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 2,
        color: C.subtleText,
    },
    achTextLocked: {
        color: "rgba(255,255,255,0.2)",
    },
    closeBtn: {
        marginTop: 16,
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
