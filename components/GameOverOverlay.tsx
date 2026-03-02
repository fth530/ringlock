import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { C } from "@/constants/game";

export function GameOverOverlay({
    score,
    bestScore,
    maxCombo,
    onRestart,
    onMenu,
}: {
    score: number;
    bestScore: number;
    maxCombo?: number;
    onRestart: () => void;
    onMenu: () => void;
}) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 420 });
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, s.gameOverWrap, style]}>
            <Text style={s.gameOverTitle}>GAME OVER</Text>
            <View style={s.separator} />
            <Text style={s.gameOverScoreLabel}>SCORE</Text>
            <Text style={s.gameOverScore}>{score}</Text>
            <Text style={s.bestLine}>BEST  {bestScore}</Text>

            {maxCombo != null && maxCombo > 1 && (
                <Text style={s.comboLine}>MAX COMBO  {maxCombo}x</Text>
            )}

            <View style={s.gameOverButtons}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Restart Game"
                    onPress={onRestart}
                    style={({ pressed }) => [s.goBtnOuter, s.goBtnPrimary, pressed && s.goBtnPressed]}
                >
                    <Text style={[s.goBtnText, s.goBtnTextPrimary]}>RESTART</Text>
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Return to Main Menu"
                    onPress={onMenu}
                    style={({ pressed }) => [s.goBtnOuter, s.goBtnSecondary, pressed && s.goBtnPressed]}
                >
                    <Text style={[s.goBtnText, s.goBtnTextSecondary]}>MAIN MENU</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    gameOverWrap: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.overlayBg,
    },
    gameOverTitle: {
        fontFamily: "Orbitron_900Black",
        fontSize: 32,
        color: C.pink,
        letterSpacing: 6,
        marginBottom: 24,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.pink,
                textShadowRadius: 20,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    separator: {
        width: 110,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.22)",
        marginBottom: 20,
    },
    gameOverScoreLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 12,
        letterSpacing: 5,
        color: C.subtleText,
        marginBottom: 2,
    },
    gameOverScore: {
        fontFamily: "Orbitron_900Black",
        fontSize: 72,
        color: C.cyan,
        lineHeight: 80,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.cyan,
                textShadowRadius: 26,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    bestLine: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 13,
        letterSpacing: 4,
        color: C.subtleText,
        marginTop: 6,
        marginBottom: 6,
    },
    comboLine: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 3,
        color: C.gold,
        marginBottom: 30,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.gold,
                textShadowRadius: 8,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    gameOverButtons: {
        gap: 14,
        alignItems: "center",
    },
    goBtnOuter: {
        borderRadius: 3,
        minWidth: 220,
        alignItems: "center",
    },
    goBtnPrimary: {
        borderWidth: 2,
        borderColor: C.cyan,
        paddingHorizontal: 36,
        paddingVertical: 14,
        ...(Platform.OS === "ios"
            ? {
                shadowColor: C.cyan,
                shadowRadius: 14,
                shadowOpacity: 0.6,
                shadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    goBtnSecondary: {
        borderWidth: 1,
        borderColor: C.pink,
        paddingHorizontal: 36,
        paddingVertical: 14,
        ...(Platform.OS === "ios"
            ? {
                shadowColor: C.pink,
                shadowRadius: 10,
                shadowOpacity: 0.5,
                shadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    goBtnPressed: {
        opacity: 0.7,
    },
    goBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 4,
    },
    goBtnTextPrimary: {
        color: C.cyan,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.cyan,
                textShadowRadius: 10,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    goBtnTextSecondary: {
        color: C.pink,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.pink,
                textShadowRadius: 8,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
});
