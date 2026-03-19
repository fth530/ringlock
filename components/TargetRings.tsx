import React from "react";
import { StyleSheet, Platform } from "react-native";
import Animated, {
    useAnimatedStyle,
    interpolateColor,
    SharedValue,
} from "react-native-reanimated";
import { C, TARGET_R, GLOW_MID_R, GLOW_OUT_R } from "@/constants/game";

export function TargetRing({
    scale,
    colorProgress,
}: {
    scale: SharedValue<number>;
    colorProgress: SharedValue<number>;
}) {
    const ringStyle = useAnimatedStyle(() => {
        const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyan, C.pink]);
        return {
            transform: [{ translateX: -TARGET_R }, { translateY: -TARGET_R }, { scale: scale.value }],
            borderColor: bc,
        };
    });

    const glowMidStyle = useAnimatedStyle(() => {
        const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyanSoft, C.pinkSoft]);
        return {
            transform: [{ translateX: -GLOW_MID_R }, { translateY: -GLOW_MID_R }, { scale: scale.value }],
            borderColor: bc,
        };
    });

    const glowOutStyle = useAnimatedStyle(() => {
        const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyanFaint, C.pinkFaint]);
        return {
            transform: [{ translateX: -GLOW_OUT_R }, { translateY: -GLOW_OUT_R }, { scale: scale.value }],
            borderColor: bc,
        };
    });

    return (
        <>
            {/* Outermost glow — border only, no background fill */}
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        width: GLOW_OUT_R * 2,
                        height: GLOW_OUT_R * 2,
                        borderRadius: GLOW_OUT_R,
                        borderWidth: 2,
                    },
                    glowOutStyle,
                ]}
            />
            {/* Mid glow ring */}
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        width: GLOW_MID_R * 2,
                        height: GLOW_MID_R * 2,
                        borderRadius: GLOW_MID_R,
                        borderWidth: 1,
                    },
                    glowMidStyle,
                ]}
            />
            {/* Target ring */}
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        width: TARGET_R * 2,
                        height: TARGET_R * 2,
                        borderRadius: TARGET_R,
                        borderWidth: 3,
                        ...(Platform.OS === "ios"
                            ? { shadowRadius: 18, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 } }
                            : {}),
                    },
                    ringStyle,
                ]}
            />
        </>
    );
}

// ─── Shrinking Ring ─────────────────────────────────────────────────────────
const FIXED_R = 150;

export function ShrinkingRing({ radius, color = C.pink, thick = false }: { radius: SharedValue<number>; color?: string; thick?: boolean }) {
    const ringStyle = useAnimatedStyle(() => {
        const scaleFactor = radius.value / FIXED_R;
        return {
            transform: [
                { translateX: -FIXED_R },
                { translateY: -FIXED_R },
                { scale: scaleFactor },
            ],
            opacity: scaleFactor > 0.01 ? 1 : 0,
        };
    });

    return (
        <Animated.View
            style={[
                styles.shrinkRingFixed,
                { borderColor: color, borderWidth: thick ? 4 : 2.5 },
                Platform.OS === "ios" ? { shadowColor: color, shadowOpacity: thick ? 1 : 1, shadowRadius: thick ? 20 : 14 } : {},
                ringStyle,
            ]}
        />
    );
}

export function RingsAnchor({
    anchorX,
    anchorY,
    ringRadius,
    targetScale,
    targetColor,
    ringColor,
    thick,
}: {
    anchorX: SharedValue<number>;
    anchorY: SharedValue<number>;
    ringRadius: SharedValue<number>;
    targetScale: SharedValue<number>;
    targetColor: SharedValue<number>;
    ringColor?: string;
    thick?: boolean;
}) {
    const anchorStyle = useAnimatedStyle(() => ({
        left: anchorX.value,
        top: anchorY.value,
    }));

    return (
        <Animated.View
            style={[styles.ringAnchor, anchorStyle]}
            pointerEvents="none"
        >
            <TargetRing scale={targetScale} colorProgress={targetColor} />
            <ShrinkingRing radius={ringRadius} color={ringColor} thick={thick} />
        </Animated.View>
    );
}

export function FlashOverlay({ opacity }: { opacity: SharedValue<number> }) {
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, styles.flashOverlay, style]}
            pointerEvents="none"
        />
    );
}

const styles = StyleSheet.create({
    ringAnchor: {
        position: "absolute",
        width: 0,
        height: 0,
    },
    // Tek bir sabit boyutlu View — sadece border, dolgu yok, elevation yok
    shrinkRingFixed: {
        position: "absolute",
        width: FIXED_R * 2,
        height: FIXED_R * 2,
        borderRadius: FIXED_R,
        borderWidth: 2.5,
        borderColor: C.pink,
        // iOS'ta shadow kullan, Android'de hiç kullanma (poligon sorunu)
        ...(Platform.OS === "ios"
            ? {
                shadowColor: C.pink,
                shadowRadius: 14,
                shadowOpacity: 1,
                shadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    flashOverlay: {
        backgroundColor: C.cyan,
    },
});
