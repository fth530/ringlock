import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from "react-native-reanimated";
import { C } from "@/constants/game";
import { generateDailyChallenge, getDailyChallengeResult, DailyChallenge } from "@/lib/dailyChallenge";
import { getStreakInfo, StreakInfo } from "@/lib/streak";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.min(SW - 48, 340);

function timeUntilMidnight(): string {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}s ${m}dk`;
}

function StreakDisplay({ info }: { info: StreakInfo }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (info.streak >= 3) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            );
        }
    }, [info.streak]);

    const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const flameEmoji = info.streak >= 30 ? "🌟" : info.streak >= 7 ? "🔥" : "⚡";

    return (
        <View style={dc.streakBox}>
            <Animated.View style={[dc.streakInner, style]}>
                <Text style={dc.streakEmoji}>{flameEmoji}</Text>
                <Text style={dc.streakNum}>{info.streak}</Text>
                <Text style={dc.streakLabel}>GÜN SERİ</Text>
            </Animated.View>
            {info.playedToday && (
                <Text style={dc.playedToday}>✓ Bugün oynadın</Text>
            )}
            {!info.playedToday && info.streak > 0 && (
                <Text style={dc.streakWarning}>Seriyi kırmamak için bugün oyna!</Text>
            )}
            {info.streak >= 7 && (
                <Text style={dc.streakMilestone}>
                    {info.streak >= 30 ? "🌟 30 Gün Efsanesi!" : "🔥 7 Günlük Seri!"}
                </Text>
            )}
        </View>
    );
}

function ChallengeCard({ challenge, completed }: { challenge: DailyChallenge; completed: boolean }) {
    const borderPulse = useSharedValue(0);

    useEffect(() => {
        if (!completed) {
            borderPulse.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            );
        }
    }, [completed]);

    const cardStyle = useAnimatedStyle(() => ({
        borderColor: completed
            ? "rgba(0,255,232,0.4)"
            : `rgba(255,215,0,${0.2 + borderPulse.value * 0.25})`,
    }));

    const modeLabels: Record<string, string> = {
        classic: "CLASSIC",
        hardcore: "HARDCORE",
        zen: "ZEN",
        speed: "SPEED RUSH",
    };

    return (
        <Animated.View style={[dc.challengeCard, cardStyle]}>
            <View style={dc.challengeHeader}>
                <Text style={dc.challengeEmoji}>{challenge.emoji}</Text>
                <View>
                    <Text style={dc.challengeTitle}>{challenge.title}</Text>
                    <Text style={dc.challengeDesc}>{challenge.description}</Text>
                </View>
                {completed && <Text style={dc.checkmark}>✓</Text>}
            </View>

            {challenge.type === "score" && (
                <View style={dc.modeTag}>
                    <Text style={dc.modeTagText}>{modeLabels[challenge.mode] ?? challenge.mode}</Text>
                </View>
            )}

            <View style={dc.challengeFooter}>
                {completed ? (
                    <Text style={dc.completedText}>TAMAMLANDI!</Text>
                ) : (
                    <Text style={dc.timeLeft}>Kalan süre: {timeUntilMidnight()}</Text>
                )}
            </View>
        </Animated.View>
    );
}

export function DailyChallengeOverlay({ onClose }: { onClose: () => void }) {
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [completed, setCompleted] = useState(false);
    const [streakInfo, setStreakInfo] = useState<StreakInfo>({ streak: 0, lastPlayDate: "", playedToday: false });
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
        const c = generateDailyChallenge();
        setChallenge(c);
        getDailyChallengeResult(c.date).then((r) => setCompleted(r?.completed ?? false));
        getStreakInfo().then(setStreakInfo);
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    function handleClose() {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onClose, 220);
    }

    return (
        <Animated.View style={[StyleSheet.absoluteFill, dc.wrap, style]}>
            <View style={dc.container}>
                <Text style={dc.title}>GÜNLÜK GÖREV</Text>
                <View style={dc.sep} />

                <StreakDisplay info={streakInfo} />

                <View style={dc.divider} />

                {challenge && <ChallengeCard challenge={challenge} completed={completed} />}

                <Text style={dc.hint}>
                    Her gün farklı bir görev • Tamamlamak için oyna
                </Text>

                <Pressable
                    onPress={handleClose}
                    style={({ pressed }) => [dc.closeBtn, pressed && { opacity: 0.6 }]}
                >
                    <Text style={dc.closeBtnText}>KAPAT</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const dc = StyleSheet.create({
    wrap: {
        backgroundColor: "rgba(3,3,16,0.97)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
    },
    container: {
        width: CARD_W,
        alignItems: "center",
    },
    title: {
        fontFamily: "Orbitron_900Black",
        fontSize: 18,
        letterSpacing: 6,
        color: C.gold,
        marginBottom: 16,
    },
    sep: {
        width: 80,
        height: 1,
        backgroundColor: "rgba(255,215,0,0.3)",
        marginBottom: 24,
    },
    divider: {
        width: CARD_W,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        marginVertical: 20,
    },

    // Streak
    streakBox: {
        alignItems: "center",
        gap: 8,
    },
    streakInner: {
        alignItems: "center",
        backgroundColor: "rgba(255,215,0,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,215,0,0.2)",
        borderRadius: 16,
        paddingHorizontal: 40,
        paddingVertical: 16,
    },
    streakEmoji: { fontSize: 32, marginBottom: 4 },
    streakNum: {
        fontFamily: "Orbitron_900Black",
        fontSize: 48,
        color: C.gold,
        lineHeight: 56,
    },
    streakLabel: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 4,
        color: "rgba(255,215,0,0.6)",
    },
    playedToday: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 10,
        letterSpacing: 2,
        color: C.cyan,
    },
    streakWarning: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 1,
        color: C.pink,
        textAlign: "center",
    },
    streakMilestone: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 11,
        letterSpacing: 2,
        color: C.gold,
        textAlign: "center",
    },

    // Challenge card
    challengeCard: {
        width: CARD_W,
        borderWidth: 1,
        borderRadius: 14,
        backgroundColor: "rgba(255,215,0,0.04)",
        padding: 18,
        gap: 12,
    },
    challengeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    challengeEmoji: { fontSize: 28 },
    challengeTitle: {
        fontFamily: "Orbitron_900Black",
        fontSize: 16,
        color: C.gold,
    },
    challengeDesc: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.5)",
        marginTop: 3,
    },
    checkmark: {
        fontSize: 22,
        color: C.cyan,
        marginLeft: "auto",
    },
    modeTag: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,215,0,0.1)",
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    modeTagText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 8,
        letterSpacing: 2,
        color: C.gold,
    },
    challengeFooter: {},
    completedText: {
        fontFamily: "Orbitron_900Black",
        fontSize: 13,
        letterSpacing: 4,
        color: C.cyan,
    },
    timeLeft: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.35)",
    },

    // Bottom
    hint: {
        fontFamily: "Orbitron_400Regular",
        fontSize: 9,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: 1,
        textAlign: "center",
        marginTop: 16,
    },
    closeBtn: {
        marginTop: 24,
        borderWidth: 1,
        borderColor: C.gold,
        borderRadius: 3,
        paddingHorizontal: 36,
        paddingVertical: 12,
    },
    closeBtnText: {
        fontFamily: "Orbitron_700Bold",
        fontSize: 13,
        letterSpacing: 4,
        color: C.gold,
    },
});
