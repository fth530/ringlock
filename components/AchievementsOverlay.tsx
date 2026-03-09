import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { C } from "@/constants/game";
import { ACHIEVEMENTS, getUnlockedAchievements } from "@/lib/achievements";

export function AchievementsOverlay({ onClose }: { onClose: () => void }) {
    const [unlocked, setUnlocked] = useState<string[]>([]);

    useEffect(() => {
        getUnlockedAchievements().then(setUnlocked);
    }, []);

    const unlockedCount = unlocked.length;
    const totalCount = ACHIEVEMENTS.length;

    return (
        <View style={[StyleSheet.absoluteFill, s.wrap]}>
            <Text style={s.title}>BASARIMLAR</Text>
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
                                    {ach.title}
                                </Text>
                                <Text style={[s.achDesc, !isUnlocked && s.achTextLocked]}>
                                    {ach.description}
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
                <Text style={s.closeText}>KAPAT</Text>
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
        fontSize: 20,
        letterSpacing: 6,
        color: C.gold,
        marginBottom: 4,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.gold,
                textShadowRadius: 14,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
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
