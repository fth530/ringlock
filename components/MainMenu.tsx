import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { C } from "@/constants/game";

export function MainMenu({
    onPlay,
    bestScore,
    topPad,
    botPad,
}: {
    onPlay: () => void;
    bestScore: number;
    topPad: number;
    botPad: number;
}) {
    return (
        <View style={[StyleSheet.absoluteFill, s.menuWrap]}>
            {bestScore > 0 && (
                <View style={[s.menuTopInfo, { top: topPad + 20 }]}>
                    <Text style={s.menuBestLabel}>BEST</Text>
                    <Text style={s.menuBestScore}>{bestScore}</Text>
                </View>
            )}

            <View style={s.menuCenter}>
                <Text style={s.gameTitle}>RINGLOCK</Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Play Game"
                    onPress={onPlay}
                    style={({ pressed }) => [s.playBtnOuter, pressed && s.playBtnPressed]}
                >
                    <View style={s.playBtnInner}>
                        <Text style={s.playText}>PLAY</Text>
                    </View>
                </Pressable>
            </View>

            <View style={[s.menuBottom, { paddingBottom: botPad + 24 }]}>
                <Text style={s.menuHint}>TAP THE RING AT JUST THE RIGHT MOMENT</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    menuWrap: {
        justifyContent: "center",
        alignItems: "center",
    },
    menuTopInfo: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
    },
    menuBestLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 10,
        letterSpacing: 5,
        color: C.subtleText,
        marginBottom: 2,
    },
    menuBestScore: {
        fontFamily: "Orbitron_900Black",
        fontSize: 48,
        color: C.cyan,
        lineHeight: 54,
        // Android textShadow fix — sadece iOS'ta
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.cyan,
                textShadowRadius: 18,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    menuCenter: {
        alignItems: "center",
    },
    gameTitle: {
        fontFamily: "Orbitron_900Black",
        fontSize: 36,
        letterSpacing: 8,
        color: C.cyan,
        marginBottom: 40,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.cyan,
                textShadowRadius: 24,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    playBtnOuter: {
        borderWidth: 2,
        borderColor: C.cyan,
        borderRadius: 4,
        ...(Platform.OS === "ios"
            ? {
                shadowColor: C.cyan,
                shadowRadius: 20,
                shadowOpacity: 0.7,
                shadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    playBtnPressed: {
        opacity: 0.75,
    },
    playBtnInner: {
        paddingHorizontal: 52,
        paddingVertical: 18,
    },
    playText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 26,
        letterSpacing: 10,
        color: C.cyan,
        ...(Platform.OS === "ios"
            ? {
                textShadowColor: C.cyan,
                textShadowRadius: 14,
                textShadowOffset: { width: 0, height: 0 },
            }
            : {}),
    },
    menuBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    menuHint: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 10,
        letterSpacing: 3,
        color: "rgba(0,255,232,0.28)",
        textAlign: "center",
        paddingHorizontal: 32,
    },
});
