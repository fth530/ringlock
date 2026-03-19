import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Easing,
} from "react-native-reanimated";
import { C } from "@/constants/game";

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const COLORS = [C.cyan, C.gold, C.pink, C.cyan, C.gold, C.pink, C.cyan, C.gold];
const RADIUS = 130;
const DURATION = 700;

type Props = {
    cx: number;
    cy: number;
};

function AnimatedParticle({
    cx,
    cy,
    angle,
    color,
    progress,
    delay,
}: {
    cx: number;
    cy: number;
    angle: number;
    color: string;
    progress: Animated.SharedValue<number>;
    delay: number;
}) {
    const rad = (angle * Math.PI) / 180;
    const targetX = cx + Math.cos(rad) * RADIUS;
    const targetY = cy + Math.sin(rad) * RADIUS;

    const style = useAnimatedStyle(() => {
        const p = Math.max(0, progress.value - delay);
        const x = interpolate(p, [0, 1], [cx, targetX]);
        const y = interpolate(p, [0, 1], [cy, targetY]);
        const opacity = interpolate(p, [0, 0.25, 1], [0, 1, 0]);
        const scale = interpolate(p, [0, 0.2, 1], [0.3, 1.2, 0.4]);
        return {
            left: x - 5,
            top: y - 5,
            opacity,
            transform: [{ scale }],
        };
    });

    return <Animated.View style={[s.particle, { backgroundColor: color }, style]} />;
}

export function ParticleEffect({ cx, cy }: Props) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, {
            duration: DURATION,
            easing: Easing.out(Easing.quad),
        });
    }, []);

    if (!cx || !cy) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {ANGLES.map((angle, i) => (
                <AnimatedParticle
                    key={angle}
                    cx={cx}
                    cy={cy}
                    angle={angle}
                    color={COLORS[i]}
                    progress={progress}
                    delay={i * 0.04}
                />
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    particle: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
