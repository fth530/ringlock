import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import Constants from "expo-constants";
import { C } from "@/constants/game";
import { useSettings } from "@/lib/SettingsContext";
import { useTranslation } from "react-i18next";

function ToggleRow({
    label,
    sublabel,
    enabled,
    onToggle,
    accessLabel,
}: {
    label: string;
    sublabel?: string;
    enabled: boolean;
    onToggle: () => void;
    accessLabel: string;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessLabel}
            style={s.row}
            onPress={onToggle}
        >
            <View style={s.rowLeft}>
                <Text style={s.label}>{label}</Text>
                {sublabel ? <Text style={s.sublabel}>{sublabel}</Text> : null}
            </View>
            <View style={[s.toggleTrack, enabled && s.toggleTrackOn]}>
                <View style={[s.toggleThumb, enabled && s.toggleThumbOn]} />
            </View>
        </Pressable>
    );
}

function SectionHeader({ label }: { label: string }) {
    return (
        <View style={s.sectionHeader}>
            <View style={s.sectionLine} />
            <Text style={s.sectionTitle}>{label}</Text>
            <View style={s.sectionLine} />
        </View>
    );
}

export function SettingsOverlay({ onClose, onLanguage }: { onClose: () => void; onLanguage?: () => void }) {
    const { t } = useTranslation();
    const opacity = useSharedValue(0);
    const {
        soundEnabled, vibrationEnabled, largeText, highContrast, musicEnabled,
        toggleSound, toggleVibration, toggleLargeText, toggleHighContrast, toggleMusic,
        resetAllData,
    } = useSettings();
    const [resetting, setResetting] = useState(false);

    React.useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const appVersion = Constants.expoConfig?.version ?? "1.0.0";

    function handleClose() {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onClose, 220);
    }

    function handleReset() {
        Alert.alert(
            t("resetTitle"),
            t("resetMessage"),
            [
                { text: t("cancel"), style: "cancel" },
                {
                    text: t("resetConfirm"),
                    style: "destructive",
                    onPress: async () => {
                        setResetting(true);
                        await resetAllData();
                        setResetting(false);
                        onClose();
                    },
                },
            ]
        );
    }

    return (
        <Animated.View style={[StyleSheet.absoluteFill, s.wrap, style]}>
            <Text style={s.title}>{t("settingsTitle")}</Text>
            <View style={s.separator} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
            >
                {/* Ses & Titreşim */}
                <SectionHeader label={t("soundVibration")} />

                <ToggleRow
                    label={t("music")}
                    sublabel={t("musicDesc")}
                    enabled={musicEnabled}
                    onToggle={toggleMusic}
                    accessLabel="Toggle Music"
                />
                <ToggleRow
                    label={t("sound")}
                    sublabel={t("soundDesc")}
                    enabled={soundEnabled}
                    onToggle={toggleSound}
                    accessLabel="Toggle Sound"
                />
                <ToggleRow
                    label={t("vibration")}
                    enabled={vibrationEnabled}
                    onToggle={toggleVibration}
                    accessLabel="Toggle Vibration"
                />

                <View style={s.divider} />

                {/* Erişilebilirlik */}
                <SectionHeader label={t("accessibilitySection")} />

                <ToggleRow
                    label={t("largeText")}
                    sublabel={t("largeTextDesc")}
                    enabled={largeText}
                    onToggle={toggleLargeText}
                    accessLabel="Toggle Large Text"
                />
                <ToggleRow
                    label={t("highContrast")}
                    sublabel={t("highContrastDesc")}
                    enabled={highContrast}
                    onToggle={toggleHighContrast}
                    accessLabel="Toggle High Contrast"
                />

                <View style={s.divider} />

                {/* Dil */}
                <SectionHeader label={t("language")} />

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Change Language"
                    onPress={onLanguage}
                    style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
                >
                    <View style={s.rowLeft}>
                        <Text style={s.label}>{t("language")}</Text>
                        <Text style={s.sublabel}>{t("languageDesc")}</Text>
                    </View>
                    <Text style={{ fontSize: 20 }}>🌍</Text>
                </Pressable>

                <View style={s.divider} />

                {/* Veri */}
                <SectionHeader label={t("dataSection")} />

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reset All Data"
                    onPress={handleReset}
                    disabled={resetting}
                    style={({ pressed }) => [s.resetBtn, pressed && { opacity: 0.6 }]}
                >
                    <Text style={s.resetBtnText}>{resetting ? t("resetting") : t("resetData")}</Text>
                </Pressable>
            </ScrollView>

            <View style={{ height: 20 }} />

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Settings"
                onPress={handleClose}
                style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            >
                <Text style={s.closeBtnText}>{t("close")}</Text>
            </Pressable>

            <Text style={s.version}>RingLock v{appVersion}</Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.overlayBg,
        zIndex: 100,
        paddingTop: 60,
        paddingBottom: 40,
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
        marginBottom: 24,
    },
    scrollContent: {
        alignItems: "center",
        width: 280,
        paddingBottom: 8,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        width: 260,
        marginBottom: 16,
    },
    sectionLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(0,255,232,0.12)",
    },
    sectionTitle: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 7,
        letterSpacing: 4,
        color: "rgba(0,255,232,0.3)",
    },
    divider: {
        width: 260,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.07)",
        marginTop: 4,
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: 260,
        marginBottom: 20,
    },
    rowLeft: {
        flex: 1,
        gap: 3,
    },
    label: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 3,
        color: C.subtleText,
    },
    sublabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 8,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.2)",
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
    resetBtn: {
        borderWidth: 1,
        borderColor: "rgba(255,0,102,0.5)",
        borderRadius: 3,
        paddingHorizontal: 24,
        paddingVertical: 10,
        marginTop: 4,
    },
    resetBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 11,
        letterSpacing: 3,
        color: C.pink,
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
    version: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 10,
        color: "rgba(0,255,232,0.2)",
        letterSpacing: 2,
        marginTop: 20,
    },
});
