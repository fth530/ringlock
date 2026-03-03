import { useReducer, useRef, useCallback, useEffect } from "react";
import { useWindowDimensions } from "react-native";
import {
    useSharedValue,
    withTiming,
    withSequence,
    cancelAnimation,
    runOnJS,
    Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { soundManager } from "@/lib/sounds";
import { useSettings } from "@/lib/SettingsContext";
import {
    Phase, HitQuality, INITIAL_DUR, MIN_DUR, DUR_STEP,
    TARGET_R, TOLERANCE, EDGE_PAD,
    PERFECT_THRESHOLD, GOOD_THRESHOLD,
    MAX_LIVES, COMBO_FOR_EXTRA_LIFE,
    PHASE_2_SCORE, PHASE_3_SCORE, PHASE_4_SCORE,
} from "@/constants/game";

// ─── Reducer ────────────────────────────────────────────────────────────────

export type GameState = {
    score: number;
    bestScore: number;
    phase: Phase;
    finalScore: number;
    combo: number;
    maxCombo: number;
    hitQuality: HitQuality;
    lives: number;
    visualPhase: number;
    duration: number;
};

export type GameAction =
    | { type: "BEGIN" }
    | { type: "HIT"; quality: HitQuality }
    | { type: "MISS" }
    | { type: "MENU" }
    | { type: "LOAD_BEST"; bestScore: number };

export const INITIAL_STATE: GameState = {
    score: 0,
    bestScore: 0,
    phase: "menu",
    finalScore: 0,
    combo: 0,
    maxCombo: 0,
    hitQuality: null,
    lives: MAX_LIVES,
    visualPhase: 1,
    duration: INITIAL_DUR,
};

function computeVisualPhase(score: number): number {
    if (score >= PHASE_4_SCORE) return 4;
    if (score >= PHASE_3_SCORE) return 3;
    if (score >= PHASE_2_SCORE) return 2;
    return 1;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case "LOAD_BEST":
            return { ...state, bestScore: action.bestScore };

        case "BEGIN":
            return {
                ...state,
                score: 0,
                combo: 0,
                maxCombo: 0,
                lives: MAX_LIVES,
                hitQuality: null,
                visualPhase: 1,
                duration: INITIAL_DUR,
                phase: "playing",
            };

        case "HIT": {
            const newScore = state.score + 1;
            const newCombo = state.combo + 1;
            const newMaxCombo = Math.max(newCombo, state.maxCombo);
            const earnedLife =
                newCombo > 0 && newCombo % COMBO_FOR_EXTRA_LIFE === 0;
            const newLives = earnedLife
                ? Math.min(state.lives + 1, MAX_LIVES)
                : state.lives;
            return {
                ...state,
                score: newScore,
                combo: newCombo,
                maxCombo: newMaxCombo,
                lives: newLives,
                hitQuality: action.quality,
                visualPhase: computeVisualPhase(newScore),
                duration: Math.max(MIN_DUR, state.duration - DUR_STEP),
            };
        }

        case "MISS": {
            const newLives = state.lives - 1;
            if (newLives <= 0) {
                return {
                    ...state,
                    combo: 0,
                    hitQuality: null,
                    lives: 0,
                    finalScore: state.score,
                    phase: "gameover",
                    bestScore: Math.max(state.bestScore, state.score),
                };
            }
            return {
                ...state,
                combo: 0,
                hitQuality: null,
                lives: newLives,
                duration: Math.max(MIN_DUR, state.duration + 20),
            };
        }

        case "MENU":
            return { ...state, phase: "menu" };

        default:
            return state;
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomTargetPos(
    topInset: number,
    botInset: number,
    screenW: number,
    screenH: number,
) {
    const topY = topInset + 170;
    const botY = screenH - botInset - EDGE_PAD;
    const minX = EDGE_PAD;
    const maxX = screenW - EDGE_PAD;
    return {
        x: minX + Math.random() * (maxX - minX),
        y: topY + Math.random() * (botY - topY),
    };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useGameLoop(topPad: number, botPad: number) {
    const { width: screenW, height: screenH } = useWindowDimensions();
    const maxR = Math.max(screenW, screenH) * 0.58;

    const { soundEnabled, vibrationEnabled } = useSettings();
    const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

    // Ref — her render'da senkron güncellenir, worklet callback'ler için
    const stateRef = useRef(state);
    stateRef.current = state;

    const soundRef = useRef(soundEnabled);
    const vibrationRef = useRef(vibrationEnabled);
    useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
    useEffect(() => { vibrationRef.current = vibrationEnabled; }, [vibrationEnabled]);

    // ── Reanimated shared values ──
    const ringRadius = useSharedValue(0);
    const flashOpacity = useSharedValue(0);
    const targetScale = useSharedValue(1);
    const targetColor = useSharedValue(0);
    const anchorX = useSharedValue(screenW / 2);
    const anchorY = useSharedValue(screenH / 2);

    // ── AsyncStorage: load best ──
    useEffect(() => {
        AsyncStorage.getItem("ringlock_best").then((v: string | null) => {
            if (v) dispatch({ type: "LOAD_BEST", bestScore: parseInt(v, 10) });
        });
    }, []);

    // ── AsyncStorage: persist best when it changes ──
    const prevBestRef = useRef(0);
    useEffect(() => {
        if (state.bestScore > prevBestRef.current) {
            prevBestRef.current = state.bestScore;
            AsyncStorage.setItem("ringlock_best", String(state.bestScore));
        }
    }, [state.bestScore]);

    // ── Sound & Haptic helpers (stable — no deps that change) ──
    const playSound = useCallback((key: "success" | "gameover") => {
        if (soundRef.current) soundManager.play(key);
    }, []);

    const haptic = useCallback(
        (type: "heavy" | "medium" | "light" | "error" | "warning") => {
            if (!vibrationRef.current) return;
            if (type === "error")
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            else if (type === "warning")
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            else if (type === "heavy")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            else if (type === "medium")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        [],
    );

    // ── Ref-based handlers — circular dependency zinciri kırıldı ──
    const handleMissRef = useRef<() => void>(() => { });
    const spawnRingRef = useRef<(dur: number) => void>(() => { });

    // spawnRing — her render'da güncellenir, her zaman güncel closure
    spawnRingRef.current = (dur: number) => {
        const pos = randomTargetPos(topPad, botPad, screenW, screenH);
        anchorX.value = pos.x;
        anchorY.value = pos.y;
        ringRadius.value = maxR;
        ringRadius.value = withTiming(
            0,
            { duration: dur, easing: Easing.linear },
            (done) => {
                if (done) runOnJS(handleMissRef.current)();
            },
        );
    };

    // handleMiss — ring süre dolunca veya yanlış tap
    handleMissRef.current = () => {
        const s = stateRef.current;
        if (s.phase !== "playing") return;

        const willDie = s.lives <= 1;
        dispatch({ type: "MISS" });

        if (willDie) {
            haptic("error");
            playSound("gameover");
        } else {
            haptic("warning");
            flashOpacity.value = withSequence(
                withTiming(0.2, { duration: 50 }),
                withTiming(0, { duration: 250 }),
            );
            const newDur = Math.max(MIN_DUR, s.duration + 20);
            spawnRingRef.current(newDur);
        }
    };

    // ── Hit handler ──
    const doHit = useCallback(
        (quality: HitQuality) => {
            const s = stateRef.current;
            dispatch({ type: "HIT", quality });

            if (quality === "perfect") haptic("heavy");
            else if (quality === "good") haptic("medium");
            else haptic("light");
            playSound("success");

            const flashIntensity =
                quality === "perfect" ? 0.5 : quality === "good" ? 0.3 : 0.15;
            flashOpacity.value = withSequence(
                withTiming(flashIntensity, { duration: 50 }),
                withTiming(0, { duration: 200 }),
            );
            targetScale.value = withSequence(
                withTiming(quality === "perfect" ? 1.6 : 1.3, { duration: 65 }),
                withTiming(1, {
                    duration: 210,
                    easing: Easing.out(Easing.quad),
                }),
            );
            targetColor.value = withSequence(
                withTiming(1, { duration: 55 }),
                withTiming(0, { duration: 310 }),
            );

            const newDur = Math.max(MIN_DUR, s.duration - DUR_STEP);
            spawnRingRef.current(newDur);
        },
        [haptic, playSound, flashOpacity, targetScale, targetColor],
    );

    // ── Public handlers ──
    const beginGame = useCallback(() => {
        dispatch({ type: "BEGIN" });
        spawnRingRef.current(INITIAL_DUR);
    }, []);

    const handleRestart = useCallback(() => {
        cancelAnimation(ringRadius);
        dispatch({ type: "BEGIN" });
        spawnRingRef.current(INITIAL_DUR);
    }, [ringRadius]);

    const handleMenu = useCallback(() => {
        cancelAnimation(ringRadius);
        ringRadius.value = 0;
        dispatch({ type: "MENU" });
    }, [ringRadius]);

    const handleScreenTap = useCallback(() => {
        if (stateRef.current.phase !== "playing") return;
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
            handleMissRef.current();
        }
    }, [ringRadius, doHit]);

    return {
        score: state.score,
        bestScore: state.bestScore,
        phase: state.phase,
        finalScore: state.finalScore,
        combo: state.combo,
        maxCombo: state.maxCombo,
        hitQuality: state.hitQuality,
        lives: state.lives,
        visualPhase: state.visualPhase,
        ringRadius,
        flashOpacity,
        targetScale,
        targetColor,
        anchorX,
        anchorY,
        beginGame,
        handleRestart,
        handleMenu,
        handleScreenTap,
    };
}
