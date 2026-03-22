import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { C } from "@/constants/game";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage, type LangCode } from "@/lib/i18n";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.min(SW - 48, 340);

export function LanguageSelectOverlay({
    onDone,
    isOnboarding = false,
}: {
    onDone: () => void;
    isOnboarding?: boolean;
}) {
    const { t, i18n } = useTranslation();
    const [selected, setSelected] = useState<LangCode>(
        (i18n.language as LangCode) ?? "en"
    );
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
    }, []);

    const wrapStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    async function handleSelect(code: LangCode) {
        setSelected(code);
        await changeLanguage(code);
    }

    function handleDone() {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onDone, 220);
    }

    return (
        <Animated.View style={[StyleSheet.absoluteFill, s.wrap, wrapStyle]}>
            <View style={s.container}>
                <Text style={s.title}>🌍</Text>
                <Text style={s.onboardingTitle}>{t("selectLanguage")}</Text>
                {!isOnboarding && <Text style={s.onboardingSubtitle}>{t("languageDesc")}</Text>}
                <View style={s.sep} />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scroll}
                >
                    {LANGUAGES.map((lang) => {
                        const isActive = lang.code === selected;
                        return (
                            <Pressable
                                key={lang.code}
                                onPress={() => handleSelect(lang.code)}
                                style={({ pressed }) => [
                                    s.langBtn,
                                    isActive && s.langBtnActive,
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Text style={s.flag}>{lang.flag}</Text>
                                <View style={s.langInfo}>
                                    <Text
                                        style={[
                                            s.langNative,
                                            isActive && { color: C.cyan },
                                        ]}
                                    >
                                        {lang.nativeName}
                                    </Text>
                                    <Text style={s.langName}>{lang.name}</Text>
                                </View>
                                {isActive && (
                                    <Text style={s.check}>✓</Text>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <Pressable
                    onPress={handleDone}
                    style={({ pressed }) => [
                        s.continueBtn,
                        pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                    ]}
                >
                    <Text style={s.continueBtnText}>
                        {t("continueBtn")}
                    </Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: {
        backgroundColor: "rgba(3,3,16,1)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
    },
    container: {
        width: CARD_W,
        maxHeight: "85%",
        alignItems: "center",
    },
    title: {
        fontSize: 40,
        marginBottom: 8,
    },
    onboardingTitle: {
        fontFamily: "Orbitron_900Black",
        fontSize: 18,
        letterSpacing: 4,
        color: C.cyan,
        marginBottom: 4,
    },
    onboardingSubtitle: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 12,
        letterSpacing: 3,
        color: "rgba(0,255,232,0.5)",
        marginBottom: 16,
    },
    settingsTitle: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        letterSpacing: 6,
        color: C.cyan,
        marginBottom: 16,
    },
    sep: {
        width: 80,
        height: 1,
        backgroundColor: "rgba(0,255,232,0.2)",
        marginBottom: 20,
    },
    scroll: {
        gap: 8,
        paddingBottom: 16,
    },
    langBtn: {
        flexDirection: "row",
        alignItems: "center",
        width: CARD_W,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    langBtnActive: {
        borderColor: C.cyan,
        backgroundColor: "rgba(0,255,232,0.06)",
    },
    flag: {
        fontSize: 28,
    },
    langInfo: {
        flex: 1,
        gap: 2,
    },
    langNative: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.8)",
    },
    langName: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.3)",
    },
    check: {
        fontSize: 18,
        color: C.cyan,
    },
    continueBtn: {
        marginTop: 16,
        backgroundColor: C.cyan,
        borderRadius: 10,
        paddingHorizontal: 32,
        paddingVertical: 16,
        width: CARD_W,
        alignItems: "center",
    },
    continueBtnText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 12,
        letterSpacing: 3,
        color: "#030310",
    },
});
