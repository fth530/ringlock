import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { C, GameMode, GAME_MODES } from "@/constants/game";

const MODE_ORDER: GameMode[] = ["classic", "hardcore", "zen", "speed"];

const MODE_COLORS: Record<GameMode, string> = {
    classic: C.cyan,
    hardcore: C.pink,
    zen: C.purple,
    speed: C.gold,
};

export function ModeSelect({
    onSelect,
    onBack,
}: {
    onSelect: (mode: GameMode) => void;
    onBack: () => void;
}) {
    return (
        <View style={[StyleSheet.absoluteFill, s.wrap]}>
            <Text style={s.title}>MOD SEC</Text>
            <View style={s.separator} />

            <View style={s.modesContainer}>
                {MODE_ORDER.map((key) => {
                    const mode = GAME_MODES[key];
                    const color = MODE_COLORS[key];
                    return (
                        <Pressable
                            key={key}
                            accessibilityRole="button"
                            accessibilityLabel={`Play ${mode.label}`}
                            onPress={() => onSelect(key)}
                            style={({ pressed }) => [
                                s.modeBtn,
                                { borderColor: color },
                                pressed && s.modeBtnPressed,
                            ]}
                        >
                            <Text style={[s.modeLabel, { color }]}>{mode.label}</Text>
                            <Text style={[s.modeDesc, { color: `${color}88` }]}>{mode.description}</Text>
                        </Pressable>
                    );
                })}
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to Menu"
                onPress={onBack}
                style={({ pressed }) => [s.backBtn, pressed && s.modeBtnPressed]}
            >
                <Text style={s.backText}>GERI</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: C.overlayBg,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        letterSpacing: 6,
        color: C.cyan,
        marginBottom: 16,
    },
    separator: {
        width: 80,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.22)",
        marginBottom: 28,
    },
    modesContainer: {
        gap: 14,
        width: "80%",
        maxWidth: 300,
    },
    modeBtn: {
        borderWidth: 1.5,
        borderRadius: 4,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    modeBtnPressed: {
        opacity: 0.65,
    },
    modeLabel: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 16,
        letterSpacing: 4,
        marginBottom: 4,
    },
    modeDesc: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 10,
        letterSpacing: 2,
    },
    backBtn: {
        marginTop: 28,
        paddingVertical: 10,
        paddingHorizontal: 30,
    },
    backText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 13,
        letterSpacing: 4,
        color: C.subtleText,
    },
});
