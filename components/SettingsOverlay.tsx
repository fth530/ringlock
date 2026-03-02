import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { C } from "@/constants/game";
import { useSettings } from "@/lib/SettingsContext";

export function SettingsOverlay({ onClose }: { onClose: () => void }) {
    const opacity = useSharedValue(0);
    const { soundEnabled, vibrationEnabled, toggleSound, toggleVibration } = useSettings();

    React.useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, s.wrap, style]}>
            <Text style={s.title}>SETTINGS</Text>
            <View style={s.separator} />

            {/* Sound Toggle */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle Sound"
                style={s.row}
                onPress={toggleSound}
            >
                <Text style={s.label}>SOUND</Text>
                <View style={[s.toggleTrack, soundEnabled && s.toggleTrackOn]}>
                    <View style={[s.toggleThumb, soundEnabled && s.toggleThumbOn]} />
                </View>
            </Pressable>

            {/* Vibration Toggle */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle Vibration"
                style={s.row}
                onPress={toggleVibration}
            >
                <Text style={s.label}>VIBRATION</Text>
                <View style={[s.toggleTrack, vibrationEnabled && s.toggleTrackOn]}>
                    <View style={[s.toggleThumb, vibrationEnabled && s.toggleThumbOn]} />
                </View>
            </Pressable>

            <View style={{ height: 40 }} />

            {/* Close */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Settings"
                onPress={onClose}
                style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            >
                <Text style={s.closeBtnText}>CLOSE</Text>
            </Pressable>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.overlayBg,
        zIndex: 100,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 24,
        color: C.cyan,
        letterSpacing: 6,
        marginBottom: 24,
    },
    separator: {
        width: 110,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.22)",
        marginBottom: 30,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: 240,
        marginBottom: 24,
    },
    label: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 3,
        color: C.subtleText,
    },
    toggleTrack: {
        width: 50,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,0,102,0.4)",
        backgroundColor: "rgba(255,0,102,0.1)",
        justifyContent: "center",
        paddingHorizontal: 3,
    },
    toggleTrackOn: {
        borderColor: C.cyan,
        backgroundColor: "rgba(0,255,232,0.15)",
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: C.pink,
        alignSelf: "flex-start",
    },
    toggleThumbOn: {
        backgroundColor: C.cyan,
        alignSelf: "flex-end",
    },
    closeBtn: {
        borderWidth: 1,
        borderColor: C.pink,
        borderRadius: 3,
        paddingHorizontal: 36,
        paddingVertical: 12,
    },
    closeBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 4,
        color: C.pink,
    },
});
