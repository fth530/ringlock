import { useState, useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import {
    useSharedValue,
    withTiming,
    withSequence,
    cancelAnimation,
    runOnJS,
    Easing,
    useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { soundManager } from "@/lib/sounds";
import { useSettings } from "@/lib/SettingsContext";
import { checkAchievements, updateLifetimeStats, type Achievement, type GameStats } from "@/lib/achievements";
import {
    Phase, HitQuality, GameMode, GAME_MODES,
    SCREEN_W, SCREEN_H, TARGET_R, MAX_R, MIRROR_MAX_R, TOLERANCE, EDGE_PAD,
    PERFECT_THRESHOLD, GOOD_THRESHOLD,
    MAX_LIVES, COMBO_FOR_EXTRA_LIFE,
} from "@/constants/game";
import { recordPlayToday } from "@/lib/streak";
import { generateDailyChallenge, checkAndCompleteDailyChallenge } from "@/lib/dailyChallenge";
import { maybeRequestReview } from "@/lib/rateReview";

function randomTargetPos(topInset: number, botInset: number) {
    const topY = (Platform.OS === "web" ? Math.max(topInset, 67) : topInset) + 200;
    const botY = SCREEN_H - (Platform.OS === "web" ? Math.max(botInset, 34) : botInset) - EDGE_PAD - 20;
    const minX = EDGE_PAD;
    const maxX = SCREEN_W - EDGE_PAD;
    return {
        x: minX + Math.random() * (maxX - minX),
        y: topY + Math.random() * (botY - topY),
    };
}

function bestKey(mode: GameMode) {
    return mode === "classic" ? "ringlock_best" : `ringlock_best_${mode}`;
}

export function useGameLoop(topPad: number, botPad: number) {
    const { soundEnabled, vibrationEnabled } = useSettings();
    const reducedMotion = useReducedMotion();
    const reducedMotionRef = useRef(reducedMotion);
    useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [phase, setPhase] = useState<Phase>("menu");
    const [finalScore, setFinalScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [hitQuality, setHitQuality] = useState<HitQuality>(null);
    const [lives, setLives] = useState(MAX_LIVES);
    const [visualPhase, setVisualPhase] = useState(1);
    const [gameMode, setGameMode] = useState<GameMode>("classic");
    const [timeLeft, setTimeLeft] = useState(0);
    const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
    const [perfectTrigger, setPerfectTrigger] = useState(0);
    const [perfectPos, setPerfectPos] = useState<{ x: number; y: number }>({ x: SCREEN_W / 2, y: SCREEN_H / 2 });
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [isDualMode, setIsDualMode] = useState(false);

    const phaseRef = useRef<Phase>("menu");
    const perfectCountRef = useRef(0);
    const goodCountRef = useRef(0);
    const lateCountRef = useRef(0);
    const missCountRef = useRef(0);
    const scoreRef = useRef(0);
    const durRef = useRef(GAME_MODES.classic.initialDur);
    const comboRef = useRef(0);
    const livesRef = useRef(MAX_LIVES);
    const maxComboRef = useRef(0);
    const modeRef = useRef<GameMode>("classic");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeLeftRef = useRef(0);
    const dualMissedRef = useRef(false);

    const soundRef = useRef(soundEnabled);
    const vibrationRef = useRef(vibrationEnabled);
    useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
    useEffect(() => { vibrationRef.current = vibrationEnabled; }, [vibrationEnabled]);

    // Primary ring
    const ringRadius = useSharedValue(0);
    const flashOpacity = useSharedValue(0);
    const targetScale = useSharedValue(1);
    const targetColor = useSharedValue(0);
    const anchorX = useSharedValue(SCREEN_W / 2);
    const anchorY = useSharedValue(SCREEN_H / 2);
    const shakeAnim = useSharedValue(0);

    // Secondary ring (dual mode)
    const ringRadius2 = useSharedValue(0);
    const anchorX2 = useSharedValue(SCREEN_W / 2 + 60);
    const anchorY2 = useSharedValue(SCREEN_H / 2 + 60);
    const targetScale2 = useSharedValue(1);
    const targetColor2 = useSharedValue(0);

    useEffect(() => {
        AsyncStorage.getItem(bestKey(gameMode)).then((v: string | null) => {
            if (v) setBestScore(parseInt(v, 10));
            else setBestScore(0);
        });
    }, [gameMode]);

    const saveBest = useCallback((s: number, mode: GameMode) => {
        AsyncStorage.getItem(bestKey(mode)).then((v: string | null) => {
            const prev = v ? parseInt(v, 10) : 0;
            if (s > prev) {
                AsyncStorage.setItem(bestKey(mode), String(s));
                setBestScore(s);
                setIsNewRecord(true);
            } else {
                setIsNewRecord(false);
            }
        });
    }, []);

    const updateVisualPhase = useCallback((s: number) => {
        if (s >= 50) setVisualPhase(4);
        else if (s >= 25) setVisualPhase(3);
        else if (s >= 10) setVisualPhase(2);
        else setVisualPhase(1);
    }, []);

    const playSound = useCallback((key: "gameover") => {
        if (soundRef.current) soundManager.play(key);
    }, []);

    const playHitSound = useCallback((quality: HitQuality, combo: number) => {
        if (soundRef.current) soundManager.playHit(quality, combo);
    }, []);

    const playMissSound = useCallback(() => {
        if (soundRef.current) soundManager.playMiss();
    }, []);

    const haptic = useCallback((type: "heavy" | "medium" | "light" | "error" | "warning") => {
        if (!vibrationRef.current) return;
        if (type === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else if (type === "warning") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else if (type === "heavy") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        else if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const doGameOver = useCallback(() => {
        if (phaseRef.current !== "playing") return;
        phaseRef.current = "gameover";
        clearTimer();
        const s = scoreRef.current;
        setFinalScore(s);
        setPhase("gameover");
        haptic("error");
        playSound("gameover");
        saveBest(s, modeRef.current);

        recordPlayToday();

        AsyncStorage.getItem("ringlock_best_combo").then((v) => {
            const prev = v ? parseInt(v, 10) : 0;
            if (maxComboRef.current > prev) {
                AsyncStorage.setItem("ringlock_best_combo", String(maxComboRef.current));
            }
        });

        const dailyChallenge = generateDailyChallenge();
        checkAndCompleteDailyChallenge(dailyChallenge, {
            score: s,
            maxCombo: maxComboRef.current,
            perfectCount: perfectCountRef.current,
            gameMode: modeRef.current,
        });

        updateLifetimeStats(s).then(({ totalGames, totalScore }) => {
            const stats: GameStats = {
                score: s,
                maxCombo: maxComboRef.current,
                perfectCount: perfectCountRef.current,
                goodCount: goodCountRef.current,
                lateCount: lateCountRef.current,
                missCount: missCountRef.current,
                totalGames,
                totalScore,
                gameMode: modeRef.current,
            };
            checkAchievements(stats).then((unlocked) => {
                if (unlocked.length > 0) setNewAchievements(unlocked);
            });
            maybeRequestReview(totalGames);
        });
    }, [saveBest, haptic, playSound, clearTimer]);

    const triggerShake = useCallback(() => {
        if (reducedMotionRef.current) return;
        shakeAnim.value = withSequence(
            withTiming(9, { duration: 35 }),
            withTiming(-9, { duration: 35 }),
            withTiming(6, { duration: 30 }),
            withTiming(-6, { duration: 30 }),
            withTiming(3, { duration: 25 }),
            withTiming(0, { duration: 25 })
        );
    }, [shakeAnim]);

    const spawnRing = useCallback((dur: number) => {
        const mode = GAME_MODES[modeRef.current];
        const pos = randomTargetPos(topPad, botPad);
        anchorX.value = pos.x;
        anchorY.value = pos.y;

        if (mode.isMirror) {
            // Ring grows from 0 → MIRROR_MAX_R; miss when it overshoots
            ringRadius.value = 0;
            ringRadius.value = withTiming(
                MIRROR_MAX_R,
                { duration: dur, easing: Easing.linear },
                (done) => { if (done) runOnJS(handleMiss)(); }
            );
        } else {
            // Classic: ring shrinks from MAX_R → 0
            ringRadius.value = MAX_R;
            ringRadius.value = withTiming(
                0,
                { duration: dur, easing: Easing.linear },
                (done) => { if (done) runOnJS(handleMiss)(); }
            );
        }

        if (mode.isDual) {
            dualMissedRef.current = false;
            // Two rings at different positions but SAME speed — fair timing
            const pos2 = randomTargetPos(topPad, botPad);
            anchorX2.value = pos2.x;
            anchorY2.value = pos2.y;
            ringRadius2.value = MAX_R;
            ringRadius2.value = withTiming(
                0,
                { duration: dur, easing: Easing.linear },
                (done) => { if (done) runOnJS(handleDualAutoMiss)(); }
            );
        }
    }, [ringRadius, ringRadius2, anchorX, anchorY, anchorX2, anchorY2, topPad, botPad]);

    const handleDualAutoMiss = useCallback(() => {
        if (phaseRef.current !== "playing") return;
        if (dualMissedRef.current) return;
        dualMissedRef.current = true;
        cancelAnimation(ringRadius);
        handleMiss();
    }, [ringRadius]);

    const handleMiss = useCallback(() => {
        if (phaseRef.current !== "playing") return;

        const mode = GAME_MODES[modeRef.current];

        // In dual mode, primary auto-miss: cancel secondary ring too
        if (mode.isDual && !dualMissedRef.current) {
            dualMissedRef.current = true;
            cancelAnimation(ringRadius2);
        }

        comboRef.current = 0;
        missCountRef.current += 1;
        setCombo(0);
        setHitQuality(null);
        haptic("warning");
        triggerShake();

        const missFlash = () => {
            if (!reducedMotionRef.current) {
                flashOpacity.value = withSequence(
                    withTiming(0.2, { duration: 50 }),
                    withTiming(0, { duration: 250 })
                );
            }
        };

        if (mode.lives === 0) {
            missFlash();
            playMissSound();
            durRef.current = Math.max(mode.minDur, durRef.current + 20);
            spawnRing(durRef.current);
            return;
        }

        livesRef.current -= 1;
        setLives(livesRef.current);

        if (livesRef.current <= 0) {
            doGameOver();
        } else {
            missFlash();
            playMissSound();
            durRef.current = Math.max(mode.minDur, durRef.current + 20);
            spawnRing(durRef.current);
        }
    }, [doGameOver, flashOpacity, haptic, playMissSound, spawnRing, triggerShake, ringRadius2]);

    const doHit = useCallback((quality: HitQuality, bonusPoint = false) => {
        const multiplier = comboRef.current >= 20 ? 4
            : comboRef.current >= 10 ? 3
            : comboRef.current >= 5  ? 2 : 1;
        const base = bonusPoint ? 2 : 1;
        scoreRef.current += base * multiplier;
        setScore(scoreRef.current);
        comboRef.current += 1;
        setCombo(comboRef.current);

        if (quality === "perfect") {
            perfectCountRef.current += 1;
            setPerfectPos({ x: anchorX.value, y: anchorY.value });
            setPerfectTrigger((t) => t + 1);
        } else if (quality === "good") goodCountRef.current += 1;
        else if (quality === "late") lateCountRef.current += 1;

        if (comboRef.current > maxComboRef.current) {
            maxComboRef.current = comboRef.current;
            setMaxCombo(comboRef.current);
        }

        const mode = GAME_MODES[modeRef.current];

        if (mode.lives > 0 && comboRef.current > 0 && comboRef.current % COMBO_FOR_EXTRA_LIFE === 0) {
            if (livesRef.current < mode.lives) {
                livesRef.current += 1;
                setLives(livesRef.current);
            }
        }

        setHitQuality(quality);
        updateVisualPhase(scoreRef.current);

        if (quality === "perfect") haptic("heavy");
        else if (quality === "good") haptic("medium");
        else haptic("light");
        playHitSound(quality, comboRef.current);

        const flashIntensity = reducedMotionRef.current ? 0 : (quality === "perfect" ? 0.5 : quality === "good" ? 0.3 : 0.15);
        if (flashIntensity > 0) {
            flashOpacity.value = withSequence(
                withTiming(flashIntensity, { duration: 50 }),
                withTiming(0, { duration: 200 })
            );
        }
        targetScale.value = withSequence(
            withTiming(quality === "perfect" ? 1.6 : 1.3, { duration: 65 }),
            withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) })
        );
        targetColor.value = withSequence(
            withTiming(1, { duration: 55 }),
            withTiming(0, { duration: 310 })
        );
        targetScale2.value = withSequence(
            withTiming(quality === "perfect" ? 1.6 : 1.3, { duration: 65 }),
            withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) })
        );
        targetColor2.value = withSequence(
            withTiming(1, { duration: 55 }),
            withTiming(0, { duration: 310 })
        );

        durRef.current = Math.max(mode.minDur, durRef.current - mode.durStep);
        spawnRing(durRef.current);
    }, [spawnRing, flashOpacity, targetScale, targetColor, targetScale2, targetColor2, updateVisualPhase, haptic, playHitSound, anchorX, anchorY]);

    const beginGame = useCallback((mode: GameMode = "classic") => {
        const config = GAME_MODES[mode];
        modeRef.current = mode;
        setGameMode(mode);
        setIsDualMode(!!config.isDual);
        scoreRef.current = 0;
        durRef.current = config.initialDur;
        phaseRef.current = "playing";
        comboRef.current = 0;
        livesRef.current = config.lives;
        maxComboRef.current = 0;
        perfectCountRef.current = 0;
        goodCountRef.current = 0;
        lateCountRef.current = 0;
        missCountRef.current = 0;
        dualMissedRef.current = false;
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setNewAchievements([]);
        setLives(config.lives);
        setHitQuality(null);
        setVisualPhase(1);
        setIsNewRecord(false);
        setPhase("playing");

        clearTimer();
        if (config.timeLimitSec > 0) {
            timeLeftRef.current = config.timeLimitSec;
            setTimeLeft(config.timeLimitSec);
            timerRef.current = setInterval(() => {
                timeLeftRef.current -= 1;
                setTimeLeft(timeLeftRef.current);
                if (timeLeftRef.current <= 0) {
                    doGameOver();
                }
            }, 1000);
        } else {
            setTimeLeft(0);
        }

        spawnRing(config.initialDur);
    }, [spawnRing, clearTimer, doGameOver]);

    const handleRestart = useCallback(() => {
        cancelAnimation(ringRadius);
        cancelAnimation(ringRadius2);
        beginGame(modeRef.current);
    }, [ringRadius, ringRadius2, beginGame]);

    const handleMenu = useCallback(() => {
        cancelAnimation(ringRadius);
        cancelAnimation(ringRadius2);
        clearTimer();
        ringRadius.value = 0;
        ringRadius2.value = 0;
        phaseRef.current = "menu";
        setPhase("menu");
    }, [ringRadius, ringRadius2, clearTimer]);

    const lastTapRef = useRef(0);
    const handleScreenTap = useCallback(() => {
        if (phaseRef.current !== "playing") return;
        const now = Date.now();
        if (now - lastTapRef.current < 80) return;
        lastTapRef.current = now;

        const mode = GAME_MODES[modeRef.current];

        if (mode.isDual) {
            // Evaluate both rings — cancelAnimation prevents worklet callbacks from firing
            const r1 = ringRadius.value;
            const r2 = ringRadius2.value;
            cancelAnimation(ringRadius);
            cancelAnimation(ringRadius2);
            dualMissedRef.current = true; // suppress any pending auto-miss

            const diff1 = Math.abs(r1 - TARGET_R);
            const diff2 = Math.abs(r2 - TARGET_R);
            const dualTolerance = TOLERANCE * 1.4; // dual modda biraz daha genis vuruş penceresi
            const hit1 = diff1 <= dualTolerance;
            const hit2 = diff2 <= dualTolerance;

            if (hit1 || hit2) {
                const bestDiff = (hit1 && hit2) ? Math.min(diff1, diff2) : hit1 ? diff1 : diff2;
                let quality: HitQuality;
                if (bestDiff <= PERFECT_THRESHOLD) quality = "perfect";
                else if (bestDiff <= GOOD_THRESHOLD) quality = "good";
                else quality = "late";
                doHit(quality, hit1 && hit2);
            } else {
                // Manual miss (bypass dualMissedRef since we already set it)
                comboRef.current = 0;
                missCountRef.current += 1;
                setCombo(0);
                setHitQuality(null);
                haptic("warning");
                triggerShake();
                livesRef.current -= 1;
                setLives(livesRef.current);
                if (livesRef.current <= 0) {
                    doGameOver();
                } else {
                    playMissSound();
                    flashOpacity.value = withSequence(
                        withTiming(0.2, { duration: 50 }),
                        withTiming(0, { duration: 250 })
                    );
                    durRef.current = Math.max(mode.minDur, durRef.current + 20);
                    spawnRing(durRef.current);
                }
            }
            return;
        }

        // Single ring (classic / mirror / hardcore / zen / speed)
        const r = ringRadius.value;
        const diff = Math.abs(r - TARGET_R);
        cancelAnimation(ringRadius);

        if (diff <= TOLERANCE) {
            let quality: HitQuality;
            if (diff <= PERFECT_THRESHOLD) quality = "perfect";
            else if (diff <= GOOD_THRESHOLD) quality = "good";
            else quality = "late";
            doHit(quality);
        } else {
            handleMiss();
        }
    }, [ringRadius, ringRadius2, doHit, handleMiss, haptic, triggerShake, doGameOver, spawnRing, flashOpacity, playMissSound]);

    useEffect(() => clearTimer, [clearTimer]);

    return {
        score, bestScore, phase, finalScore,
        combo, maxCombo, hitQuality, lives, visualPhase,
        gameMode, timeLeft, newAchievements,
        perfectTrigger, perfectPos, isNewRecord,
        isDualMode, reducedMotion,
        ringRadius, flashOpacity, targetScale, targetColor, anchorX, anchorY,
        ringRadius2, anchorX2, anchorY2, targetScale2, targetColor2,
        shakeAnim,
        beginGame, handleRestart, handleMenu, handleScreenTap,
    };
}
