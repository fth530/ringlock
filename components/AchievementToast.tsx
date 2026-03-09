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
import type { Achievement } from "@/lib/achievements";

export function AchievementToast({
    achievement,
    onDone,
}: {
    achievement: Achievement;
    onDone: () => void;
}) {
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
            <Text style={s.title}>{achievement.title}</Text>
            <Text style={s.desc}>{achievement.description}</Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    toast: {
        position: "absolute",
        top: 100,
        left: 30,
        right: 30,
        backgroundColor: "rgba(0,255,232,0.08)",
        borderWidth: 1,
        borderColor: C.gold,
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
        zIndex: 100,
        ...(Platform.OS === "ios"
            ? {
                shadowColor: C.gold,
                shadowRadius: 16,
                shadowOpacity: 0.5,
                shadowOffset: { width: 0, height: 0 },
            }
            : {}),
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
