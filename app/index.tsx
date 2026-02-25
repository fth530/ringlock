import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Text,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  cancelAnimation,
  runOnJS,
  Easing,
  interpolateColor,
  SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CX = SCREEN_W / 2;
const CY = SCREEN_H / 2;

const TARGET_R = 68;
const TOLERANCE = 26;
const MAX_R = Math.max(SCREEN_W, SCREEN_H) * 0.56;
const INITIAL_DUR = 2300;
const MIN_DUR = 480;
const DUR_STEP = 58;

const C = {
  bg: "#030310",
  bgMid: "#08082a",
  cyan: "#00FFE8",
  cyanFaint: "rgba(0,255,232,0.06)",
  cyanSoft: "rgba(0,255,232,0.16)",
  pink: "#FF0066",
  pinkFaint: "rgba(255,0,102,0.06)",
  pinkSoft: "rgba(255,0,102,0.16)",
  subtleText: "rgba(0,255,232,0.45)",
  overlayBg: "rgba(3,3,16,0.95)",
};

type Phase = "idle" | "playing" | "gameover";

// ─── Grid background ────────────────────────────────────────────────────────
function GridBackground() {
  const lines: React.ReactNode[] = [];
  const step = 52;
  for (let x = 0; x <= SCREEN_W; x += step)
    lines.push(
      <View key={`v${x}`} style={[s.gridLine, { left: x, width: 1, height: SCREEN_H }]} />
    );
  for (let y = 0; y <= SCREEN_H; y += step)
    lines.push(
      <View key={`h${y}`} style={[s.gridLine, { top: y, height: 1, width: SCREEN_W }]} />
    );
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{lines}</View>;
}

// ─── Target ring ─────────────────────────────────────────────────────────────
// Anchor is at screen center (CX, CY). All elements use translateX/Y to center.
const TARGET_D = TARGET_R * 2;
const GLOW_MID_R = TARGET_R + 14;
const GLOW_OUT_R = TARGET_R + 38;

function TargetRing({
  scale,
  colorProgress,
}: {
  scale: SharedValue<number>;
  colorProgress: SharedValue<number>;
}) {
  const ringStyle = useAnimatedStyle(() => {
    const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyan, C.pink]);
    return {
      transform: [
        { translateX: -TARGET_R },
        { translateY: -TARGET_R },
        { scale: scale.value },
      ],
      borderColor: bc,
      shadowColor: bc,
    };
  });

  const glowMidStyle = useAnimatedStyle(() => {
    const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyanSoft, C.pinkSoft]);
    return {
      transform: [
        { translateX: -GLOW_MID_R },
        { translateY: -GLOW_MID_R },
        { scale: scale.value },
      ],
      borderColor: bc,
    };
  });

  const glowOutStyle = useAnimatedStyle(() => {
    const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyanFaint, C.pinkFaint]);
    return {
      transform: [
        { translateX: -GLOW_OUT_R },
        { translateY: -GLOW_OUT_R },
        { scale: scale.value },
      ],
      backgroundColor: bc,
    };
  });

  return (
    <View style={s.centerAnchor} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: "absolute",
            width: GLOW_OUT_R * 2,
            height: GLOW_OUT_R * 2,
            borderRadius: GLOW_OUT_R,
          },
          glowOutStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: GLOW_MID_R * 2,
            height: GLOW_MID_R * 2,
            borderRadius: GLOW_MID_R,
            borderWidth: 1,
          },
          glowMidStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: TARGET_D,
            height: TARGET_D,
            borderRadius: TARGET_R,
            borderWidth: 3,
            shadowRadius: 18,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
          },
          ringStyle,
        ]}
      />
    </View>
  );
}

// ─── Shrinking ring ───────────────────────────────────────────────────────────
const SHRINK_GLOW_EXTRA = 16;
const SHRINK_GLOW_FAINT_EXTRA = 38;

function ShrinkingRing({ radius }: { radius: SharedValue<number> }) {
  const ringStyle = useAnimatedStyle(() => {
    const r = radius.value;
    return {
      position: "absolute",
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      transform: [{ translateX: -r }, { translateY: -r }],
    };
  });

  const glowMidStyle = useAnimatedStyle(() => {
    const r = radius.value + SHRINK_GLOW_EXTRA;
    return {
      position: "absolute",
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      transform: [{ translateX: -r }, { translateY: -r }],
    };
  });

  const glowFaintStyle = useAnimatedStyle(() => {
    const r = radius.value + SHRINK_GLOW_FAINT_EXTRA;
    return {
      position: "absolute",
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      transform: [{ translateX: -r }, { translateY: -r }],
    };
  });

  return (
    <View style={s.centerAnchor} pointerEvents="none">
      <Animated.View style={[s.shrinkGlowFaint, glowFaintStyle]} />
      <Animated.View style={[s.shrinkGlowMid, glowMidStyle]} />
      <Animated.View style={[s.shrinkRing, ringStyle]} />
    </View>
  );
}

// ─── Flash overlay ────────────────────────────────────────────────────────────
function FlashOverlay({ opacity }: { opacity: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, s.flashOverlay, style]}
      pointerEvents="none"
    />
  );
}

// ─── Game over overlay ────────────────────────────────────────────────────────
function GameOverOverlay({
  opacity,
  score,
  bestScore,
}: {
  opacity: SharedValue<number>;
  score: number;
  bestScore: number;
}) {
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, s.gameOverWrap, style]}
      pointerEvents="none"
    >
      <Text style={s.gameOverTitle}>GAME OVER</Text>
      <View style={s.separator} />
      <Text style={s.gameOverScoreLabel}>SCORE</Text>
      <Text style={s.gameOverScore}>{score}</Text>
      <Text style={s.bestLine}>BEST  {bestScore}</Text>
      <View style={s.restartBtnOuter}>
        <View style={s.restartBtnInner}>
          <Text style={s.restartText}>TAP TO RESTART</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main game screen ─────────────────────────────────────────────────────────
export default function GameScreen() {
  const insets = useSafeAreaInsets();

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [finalScore, setFinalScore] = useState(0);

  const phaseRef = useRef<Phase>("idle");
  const scoreRef = useRef(0);
  const durRef = useRef(INITIAL_DUR);

  // Shared values
  const ringRadius = useSharedValue(MAX_R);
  const flashOpacity = useSharedValue(0);
  const targetScale = useSharedValue(1);
  const targetColor = useSharedValue(0); // 0 = cyan, 1 = pink
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    AsyncStorage.getItem("antigravity_best").then((v) => {
      if (v) setBestScore(parseInt(v, 10));
    });
  }, []);

  const saveBest = useCallback((s: number) => {
    AsyncStorage.getItem("antigravity_best").then((v) => {
      const prev = v ? parseInt(v, 10) : 0;
      if (s > prev) {
        AsyncStorage.setItem("antigravity_best", String(s));
        setBestScore(s);
      }
    });
  }, []);

  const doGameOver = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "gameover";
    const s = scoreRef.current;
    setFinalScore(s);
    setPhase("gameover");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    saveBest(s);
    overlayOpacity.value = withTiming(1, { duration: 450 });
  }, [saveBest, overlayOpacity]);

  const spawnRing = useCallback(
    (dur: number) => {
      ringRadius.value = MAX_R;
      ringRadius.value = withTiming(0, { duration: dur, easing: Easing.linear }, (done) => {
        if (done) runOnJS(doGameOver)();
      });
    },
    [doGameOver, ringRadius]
  );

  const doHit = useCallback(() => {
    scoreRef.current += 1;
    setScore(scoreRef.current);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    flashOpacity.value = withSequence(
      withTiming(0.38, { duration: 50 }),
      withTiming(0, { duration: 200 })
    );
    targetScale.value = withSequence(
      withTiming(1.38, { duration: 65 }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
    );
    targetColor.value = withSequence(
      withTiming(1, { duration: 55 }),
      withTiming(0, { duration: 300 })
    );

    durRef.current = Math.max(MIN_DUR, durRef.current - DUR_STEP);
    spawnRing(durRef.current);
  }, [spawnRing, flashOpacity, targetScale, targetColor]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    durRef.current = INITIAL_DUR;
    phaseRef.current = "playing";
    setScore(0);
    setPhase("playing");
    overlayOpacity.value = 0;
    spawnRing(INITIAL_DUR);
  }, [spawnRing, overlayOpacity]);

  const handleTap = useCallback(() => {
    const p = phaseRef.current;
    if (p === "idle" || p === "gameover") {
      startGame();
      return;
    }
    if (p !== "playing") return;

    const r = ringRadius.value;
    const hit = r >= TARGET_R - TOLERANCE && r <= TARGET_R + TOLERANCE;
    cancelAnimation(ringRadius);
    if (hit) doHit();
    else doGameOver();
  }, [ringRadius, doHit, doGameOver, startGame]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={[C.bg, C.bgMid, C.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <GridBackground />

      {/* Full-screen tap */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* Score */}
      <View style={[s.scoreArea, { paddingTop: topPad + 14 }]} pointerEvents="none">
        <Text style={s.scoreLabel}>SCORE</Text>
        <Text style={s.scoreValue}>{score}</Text>
        {phase === "playing" && bestScore > 0 && (
          <Text style={s.bestInline}>BEST  {bestScore}</Text>
        )}
      </View>

      {/* Rings layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <TargetRing scale={targetScale} colorProgress={targetColor} />
        <ShrinkingRing radius={ringRadius} />
      </View>

      {/* Idle screen */}
      {phase === "idle" && (
        <View
          style={[s.idleBox, { paddingBottom: botPad + 28 }]}
          pointerEvents="none"
        >
          <Text style={s.gameTitle}>ANTIGRAVITY</Text>
          <Text style={s.tapPrompt}>TAP ANYWHERE TO START</Text>
        </View>
      )}

      {/* Flash */}
      <FlashOverlay opacity={flashOpacity} />

      {/* Game over */}
      <GameOverOverlay
        opacity={overlayOpacity}
        score={finalScore}
        bestScore={bestScore}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(0,255,232,0.035)",
  },

  // Anchor at screen center; children use transform to offset themselves
  centerAnchor: {
    position: "absolute",
    left: CX,
    top: CY,
    width: 0,
    height: 0,
  },

  // Score display
  scoreArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  scoreLabel: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 11,
    letterSpacing: 5,
    color: C.subtleText,
    marginBottom: 2,
  },
  scoreValue: {
    fontFamily: "Orbitron_900Black",
    fontSize: 76,
    color: C.cyan,
    lineHeight: 84,
    textShadowColor: C.cyan,
    textShadowRadius: 22,
    textShadowOffset: { width: 0, height: 0 },
  },
  bestInline: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 11,
    letterSpacing: 4,
    color: C.subtleText,
    marginTop: 4,
  },

  // Rings
  shrinkGlowFaint: {
    backgroundColor: C.pinkFaint,
  },
  shrinkGlowMid: {
    borderWidth: 1,
    borderColor: C.pinkSoft,
  },
  shrinkRing: {
    borderWidth: 2.5,
    borderColor: C.pink,
    shadowColor: C.pink,
    shadowRadius: 14,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  // Flash
  flashOverlay: {
    backgroundColor: C.cyan,
  },

  // Game over
  gameOverWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.overlayBg,
  },
  gameOverTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 32,
    color: C.pink,
    letterSpacing: 6,
    textShadowColor: C.pink,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: 24,
  },
  separator: {
    width: 110,
    height: 1,
    backgroundColor: "rgba(0,255,232,0.25)",
    marginBottom: 20,
  },
  gameOverScoreLabel: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 12,
    letterSpacing: 5,
    color: C.subtleText,
    marginBottom: 2,
  },
  gameOverScore: {
    fontFamily: "Orbitron_900Black",
    fontSize: 92,
    color: C.cyan,
    lineHeight: 100,
    textShadowColor: C.cyan,
    textShadowRadius: 26,
    textShadowOffset: { width: 0, height: 0 },
  },
  bestLine: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 13,
    letterSpacing: 4,
    color: C.subtleText,
    marginTop: 6,
    marginBottom: 44,
  },
  restartBtnOuter: {
    borderWidth: 1,
    borderColor: C.pink,
    borderRadius: 3,
    shadowColor: C.pink,
    shadowRadius: 14,
    shadowOpacity: 0.65,
    shadowOffset: { width: 0, height: 0 },
  },
  restartBtnInner: {
    paddingHorizontal: 30,
    paddingVertical: 13,
  },
  restartText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 13,
    letterSpacing: 5,
    color: C.pink,
    textShadowColor: C.pink,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },

  // Idle
  idleBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  gameTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 30,
    letterSpacing: 8,
    color: C.cyan,
    textShadowColor: C.cyan,
    textShadowRadius: 22,
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: 10,
  },
  tapPrompt: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 12,
    letterSpacing: 4,
    color: C.subtleText,
  },
});
