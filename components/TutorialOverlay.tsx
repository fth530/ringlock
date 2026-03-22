import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    interpolate,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { C } from "@/constants/game";

const TUTORIAL_KEY = "ringlock_tutorial_done";
const { width: SW, height: SH } = Dimensions.get("window");

const STEP_COUNT = 3;

function AnimatedRingDemo({ step, comboText, perfectText }: { step: number; comboText: string; perfectText: string }) {
    const radius = useSharedValue(90);
    const tap = useSharedValue(1);
    const comboFlash = useSharedValue(0);

    useEffect(() => {
        radius.value = 90;
        comboFlash.value = 0;
        tap.value = 1;

        if (step === 0) {
            radius.value = withRepeat(
                withSequence(
                    withTiming(20, { duration: 1800, easing: Easing.linear }),
                    withTiming(90, { duration: 0 })
                ),
                -1,
                false
            );
        } else if (step === 1) {
            radius.value = withRepeat(
                withSequence(
                    withTiming(20, { duration: 1800, easing: Easing.linear }),
                    withTiming(90, { duration: 0 })
                ),
                -1,
                false
            );
            tap.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1650 }),
                    withTiming(0.5, { duration: 120 }),
                    withTiming(1, { duration: 200 })
                ),
                -1,
                false
            );
        } else {
            // Combo step: halka küçülür, hedefe ulaşır, kombo yazısı parlar, tekrarlar
            radius.value = withRepeat(
                withSequence(
                    withTiming(30, { duration: 1400, easing: Easing.linear }),
                    withTiming(30, { duration: 600 }),
                    withTiming(90, { duration: 0 })
                ),
                -1,
                false
            );
            comboFlash.value = withRepeat(
                withSequence(
                    withTiming(0, { duration: 1300 }),
                    withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
                    withTiming(1, { duration: 550 }),
                    withTiming(0, { duration: 0 })
                ),
                -1,
                false
            );
        }
    }, [step]);

    const TARGET_R = 30;

    const ringStyle = useAnimatedStyle(() => ({
        width: radius.value * 2,
        height: radius.value * 2,
        borderRadius: radius.value,
        borderColor: interpolate(
            Math.abs(radius.value - TARGET_R),
            [0, 5, 20],
            [1, 0.6, 0],
            "clamp"
        ) > 0.5 ? C.cyan : C.gold,
        opacity: 0.85,
    }));

    const tapStyle = useAnimatedStyle(() => ({
        opacity: tap.value,
        transform: [{ scale: interpolate(tap.value, [0.5, 1], [1.3, 1]) }],
    }));

    const comboStyle = useAnimatedStyle(() => ({
        opacity: comboFlash.value,
        transform: [{ scale: interpolate(comboFlash.value, [0, 1], [0.7, 1]) }],
    }));

    return (
        <View style={d.demoArea}>
            <View style={d.targetRing} />
            <Animated.View style={[d.shrinkRing, ringStyle]} />
            {step === 1 && (
                <Animated.View style={[d.tapIndicator, tapStyle]}>
                    <Text style={d.tapText}>TAP</Text>
                </Animated.View>
            )}
            {step === 2 && (
                <Animated.View style={[d.comboLabel, comboStyle]}>
                    <Text style={d.comboText}>{comboText}</Text>
                    <Text style={d.comboSub}>{perfectText}</Text>
                </Animated.View>
            )}
        </View>
    );
}

function StepDots({ total, current }: { total: number; current: number }) {
    return (
        <View style={d.dots}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[d.dot, i === current && d.dotActive]}
                />
            ))}
        </View>
    );
}

export function TutorialOverlay({ onDone }: { onDone: () => void }) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const opacity = useSharedValue(0);

    const STEPS = [
        { title: t("tutorialStep1Title"), desc: t("tutorialStep1Desc"), hint: t("tutorialStep1Hint") },
        { title: t("tutorialStep2Title"), desc: t("tutorialStep2Desc"), hint: t("tutorialStep2Hint") },
        { title: t("tutorialStep3Title"), desc: t("tutorialStep3Desc"), hint: t("tutorialStep3Hint") },
    ];

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 400 });
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    function handleNext() {
        if (step < STEP_COUNT - 1) {
            setStep((s) => s + 1);
        } else {
            handleFinish();
        }
    }

    function handleFinish() {
        AsyncStorage.setItem(TUTORIAL_KEY, "1");
        opacity.value = withTiming(0, { duration: 300 });
        setTimeout(onDone, 320);
    }

    const current = STEPS[step];
    const isLast = step === STEP_COUNT - 1;

    return (
        <Animated.View style={[StyleSheet.absoluteFill, d.wrap, style]}>
            <View style={d.card}>
                <Text style={d.stepCount}>{t("stepCount", { current: step + 1, total: STEP_COUNT })}</Text>

                <AnimatedRingDemo step={step} comboText={t("comboDemo")} perfectText={t("perfect")} />

                <Text style={d.title}>{current.title}</Text>
                <Text style={d.desc}>{current.desc}</Text>
                <Text style={d.hint}>{current.hint}</Text>

                <StepDots total={STEP_COUNT} current={step} />

                <View style={d.navRow}>
                    {step > 0 ? (
                        <Pressable
                            onPress={() => setStep((s) => s - 1)}
                            style={({ pressed }) => [d.backBtn, pressed && { opacity: 0.7 }]}
                        >
                            <Text style={d.backBtnText}>{t("back")}</Text>
                        </Pressable>
                    ) : (
                        <View style={d.backPlaceholder} />
                    )}

                    <Pressable
                        onPress={handleNext}
                        style={({ pressed }) => [d.btn, pressed && { opacity: 0.7 }]}
                    >
                        <Text style={d.btnText} numberOfLines={1}>{isLast ? t("start") : t("next")}</Text>
                    </Pressable>
                </View>

                <Pressable onPress={handleFinish} style={d.skip}>
                    <Text style={d.skipText}>{t("skip")}</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

export async function shouldShowTutorial(): Promise<boolean> {
    const done = await AsyncStorage.getItem(TUTORIAL_KEY);
    return done === null;
}

const d = StyleSheet.create({
    wrap: {
        backgroundColor: "rgba(3,3,16,1)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
    },
    card: {
        width: Math.min(SW - 48, 360),
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 24,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: `${C.cyan}30`,
        borderRadius: 20,
    },
    stepCount: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 4,
        color: C.subtleText,
        marginBottom: 24,
    },
    demoArea: {
        width: 180,
        height: 180,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
    },
    targetRing: {
        position: "absolute",
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2.5,
        borderColor: `${C.cyan}60`,
    },
    shrinkRing: {
        position: "absolute",
        borderWidth: 2.5,
    },
    tapIndicator: {
        position: "absolute",
        backgroundColor: `${C.pink}20`,
        borderWidth: 1,
        borderColor: C.pink,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tapText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 12,
        color: C.pink,
        letterSpacing: 3,
    },
    comboLabel: {
        position: "absolute",
        alignItems: "center",
    },
    comboText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        color: C.gold,
    },
    comboSub: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 9,
        letterSpacing: 4,
        color: C.gold,
        marginTop: 4,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 18,
        letterSpacing: 5,
        color: C.cyan,
        marginBottom: 12,
        textAlign: "center",
    },
    desc: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 12,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 10,
    },
    hint: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 10,
        letterSpacing: 1,
        color: C.subtleText,
        textAlign: "center",
        marginBottom: 24,
    },
    dots: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 28,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: `${C.cyan}25`,
    },
    dotActive: {
        backgroundColor: C.cyan,
    },
    navRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
    },
    backBtn: {
        borderWidth: 1.5,
        borderColor: `${C.cyan}50`,
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 12,
        letterSpacing: 3,
        color: C.cyan,
    },
    backPlaceholder: {
        width: 0,
    },
    btn: {
        flex: 1,
        backgroundColor: C.cyan,
        borderRadius: 10,
        paddingHorizontal: 36,
        paddingVertical: 16,
        alignItems: "center",
    },
    btnText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 13,
        letterSpacing: 3,
        color: "#030310",
    },
    skip: {
        paddingVertical: 6,
    },
    skipText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 11,
        color: "rgba(255,255,255,0.25)",
        letterSpacing: 2,
    },
});
