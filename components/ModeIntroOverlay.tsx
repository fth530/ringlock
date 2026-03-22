import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { C } from "@/constants/game";

const { width: SW } = Dimensions.get("window");

const MIRROR_KEY = "ringlock_tutorial_mirror_done";
const DUAL_KEY   = "ringlock_tutorial_dual_done";

export async function shouldShowModeIntro(mode: "mirror" | "dual"): Promise<boolean> {
    const key = mode === "mirror" ? MIRROR_KEY : DUAL_KEY;
    const done = await AsyncStorage.getItem(key);
    return done === null;
}

export async function markModeIntroDone(mode: "mirror" | "dual"): Promise<void> {
    const key = mode === "mirror" ? MIRROR_KEY : DUAL_KEY;
    await AsyncStorage.setItem(key, "1");
}

// ─── Mirror Demo: ring büyür dışa doğru ─────────────────────────────────────
function MirrorDemo() {
    const radius = useSharedValue(20);
    const TARGET = 54;

    useEffect(() => {
        radius.value = withRepeat(
            withSequence(
                withTiming(TARGET + 2, { duration: 1600, easing: Easing.linear }),
                withTiming(TARGET + 2, { duration: 300 }),
                withTiming(20, { duration: 0 })
            ),
            -1,
            false
        );
    }, []);

    const growStyle = useAnimatedStyle(() => ({
        width: radius.value * 2,
        height: radius.value * 2,
        borderRadius: radius.value,
        borderColor: Math.abs(radius.value - TARGET) < 8 ? C.gold : "#00BFFF",
        opacity: 0.9,
    }));

    return (
        <View style={d.demoBox}>
            <View style={[d.demoTarget, { borderColor: `${C.cyan}55`, width: TARGET * 2, height: TARGET * 2, borderRadius: TARGET }]} />
            <Animated.View style={[d.demoRing, growStyle]} />
            <View style={d.centerDot} />
            <View style={d.arrowWrap}>
                <Text style={d.arrowText}>→</Text>
            </View>
        </View>
    );
}

// ─── Dual Demo: iki halka eş zamanlı ─────────────────────────────────────────
function DualDemo() {
    const r1 = useSharedValue(90);
    const r2 = useSharedValue(90);
    const TARGET = 30;
    const RING_MAX = 90;

    useEffect(() => {
        r1.value = withRepeat(
            withSequence(
                withTiming(TARGET, { duration: 1400, easing: Easing.linear }),
                withTiming(TARGET, { duration: 400 }),
                withTiming(RING_MAX, { duration: 0 })
            ),
            -1,
            false
        );
        r2.value = withRepeat(
            withSequence(
                withTiming(TARGET, { duration: 1700, easing: Easing.linear }),
                withTiming(TARGET, { duration: 400 }),
                withTiming(RING_MAX, { duration: 0 })
            ),
            -1,
            false
        );
    }, []);

    const ring1Style = useAnimatedStyle(() => ({
        width: r1.value * 2,
        height: r1.value * 2,
        borderRadius: r1.value,
        borderColor: Math.abs(r1.value - TARGET) < 8 ? C.gold : C.pink,
    }));
    const ring2Style = useAnimatedStyle(() => ({
        width: r2.value * 2,
        height: r2.value * 2,
        borderRadius: r2.value,
        borderColor: Math.abs(r2.value - TARGET) < 8 ? C.gold : "#FF0066",
    }));

    return (
        <View style={d.demoBoxDual}>
            {/* Ring 1 — sol */}
            <View style={d.dualSlot}>
                <View style={[d.demoTarget, { borderColor: `${C.cyan}55`, width: TARGET * 2, height: TARGET * 2, borderRadius: TARGET }]} />
                <Animated.View style={[d.demoRing, ring1Style]} />
                <Text style={[d.ringLabel, { color: C.pink }]}>①</Text>
            </View>
            {/* Ring 2 — sağ */}
            <View style={d.dualSlot}>
                <View style={[d.demoTarget, { borderColor: "#FF006655", width: TARGET * 2, height: TARGET * 2, borderRadius: TARGET }]} />
                <Animated.View style={[d.demoRing, ring2Style, { borderColor: "#FF0066" }]} />
                <Text style={[d.ringLabel, { color: "#FF0066" }]}>②</Text>
            </View>
        </View>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ModeIntroOverlay({
    mode,
    onDone,
}: {
    mode: "mirror" | "dual";
    onDone: () => void;
}) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 350 });
    }, []);

    const wrapStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    function handleDone() {
        markModeIntroDone(mode);
        opacity.value = withTiming(0, { duration: 280 });
        setTimeout(onDone, 300);
    }

    const { t } = useTranslation();

    const isMirror = mode === "mirror";
    const accentColor = isMirror ? "#00BFFF" : "#FF0066";

    const title       = isMirror ? t("mirrorModeTitle") : t("dualModeTitle");
    const subtitle    = isMirror ? t("mirrorSubtitle")  : t("dualSubtitle");
    const lines       = isMirror
        ? [t("mirrorLine1"), t("mirrorLine2"), t("mirrorLine3")]
        : [t("dualLine1"), t("dualLine2"), t("dualLine3")];

    return (
        <Animated.View style={[StyleSheet.absoluteFill, d.wrap, wrapStyle]}>
            <View style={d.card}>
                {/* Header */}
                <View style={[d.pill, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}>
                    <Text style={[d.pillText, { color: accentColor }]}>{subtitle}</Text>
                </View>
                <Text style={[d.title, { color: accentColor }]}>{title}</Text>

                {/* Demo animation */}
                {isMirror ? <MirrorDemo /> : <DualDemo />}

                {/* Açıklama */}
                <View style={d.linesWrap}>
                    {lines.map((line, i) => (
                        <View key={i} style={d.lineRow}>
                            <View style={[d.lineDot, { backgroundColor: accentColor }]} />
                            <Text style={d.lineText}>{line}</Text>
                        </View>
                    ))}
                </View>

                {/* Buton */}
                <Pressable
                    onPress={handleDone}
                    style={({ pressed }) => [
                        d.btn,
                        { backgroundColor: accentColor },
                        pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                    ]}
                >
                    <Text style={d.btnText}>{t("understood")}</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
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
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        gap: 16,
    },
    pill: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
    },
    pillText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 9,
        letterSpacing: 4,
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 22,
        letterSpacing: 6,
        textAlign: "center",
    },

    // Demo areas
    demoBox: {
        width: 180,
        height: 130,
        alignItems: "center",
        justifyContent: "center",
    },
    demoTarget: {
        position: "absolute",
        borderWidth: 2.5,
    },
    demoRing: {
        position: "absolute",
        borderWidth: 2.5,
    },
    centerDot: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: C.cyan,
        opacity: 0.8,
    },
    arrowWrap: {
        position: "absolute",
        bottom: 4,
        right: 16,
    },
    arrowText: {
        color: `${C.cyan}60`,
        fontSize: 18,
    },

    demoBoxDual: {
        flexDirection: "row",
        gap: 32,
        height: 120,
        alignItems: "center",
        justifyContent: "center",
    },
    dualSlot: {
        width: 80,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    ringLabel: {
        position: "absolute",
        bottom: -18,
        fontFamily: "Orbitron_700Bold",
        fontSize: 16,
    },

    // Lines
    linesWrap: {
        width: "100%",
        gap: 10,
        paddingHorizontal: 4,
    },
    lineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    lineDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 6,
        flexShrink: 0,
    },
    lineText: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 11,
        letterSpacing: 0.5,
        color: "rgba(255,255,255,0.75)",
        lineHeight: 18,
        flex: 1,
    },

    // Button
    btn: {
        borderRadius: 10,
        paddingHorizontal: 32,
        paddingVertical: 16,
        marginTop: 4,
        width: "100%",
        alignItems: "center",
    },
    btnText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 13,
        letterSpacing: 3,
        color: "#030310",
    },
});
