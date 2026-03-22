import React, { useEffect } from "react";
import { Text, StyleSheet, Platform } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from "react-native-reanimated";
import { C } from "@/constants/game";
import { useTranslation } from "react-i18next";
import type { Achievement } from "@/lib/achievements";

const achKeyMap: Record<string, string> = {
    score_10: "score10", score_25: "score25", score_50: "score50", score_100: "score100",
    combo_10: "combo10", combo_25: "combo25", combo_50: "combo50",
    perfect_5: "perfect5", perfect_15: "perfect15", perfect_only: "perfectOnly",
    hardcore_20: "hardcore20", speed_30: "speed30", zen_100: "zen100",
    mirror_15: "mirror15", mirror_30: "mirror30",
    dual_10: "dual10", dual_25: "dual25",
    games_10: "games10", games_50: "games50", total_500: "total500",
};

export function AchievementToast({
    achievement,
    onDone,
}: {
    achievement: Achievement;
    onDone: () => void;
}) {
    const { t } = useTranslation();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withSequence(
            withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
            withDelay(2200, withTiming(-100, { duration: 300 }))
        );
        opacity.value = withSequence(
            withTiming(1, { duration: 300 }),
            withDelay(2200, withTiming(0, { duration: 300 }))
        );
        const timer = setTimeout(onDone, 2800);
        return () => clearTimeout(timer);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[s.toast, animStyle]} pointerEvents="none">
            <Text style={s.icon}>{achievement.icon}</Text>
            <Text style={s.title}>{t(`ach.${achKeyMap[achievement.id]}.title`)}</Text>
            <Text style={s.desc}>{t(`ach.${achKeyMap[achievement.id]}.desc`)}</Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    toast: {
        position: "absolute",
        top: 54,
        left: 30,
        right: 30,
        backgroundColor: "rgba(3,3,16,0.95)",
        borderWidth: 1,
        borderColor: "rgba(0,255,232,0.15)",
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
        zIndex: 300,
    },
    icon: {
        fontSize: 24,
        marginBottom: 4,
    },
    title: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 14,
        letterSpacing: 4,
        color: C.gold,
        marginBottom: 2,
    },
    desc: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 10,
        letterSpacing: 2,
        color: C.subtleText,
    },
});
