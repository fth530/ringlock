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

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const TARGET_R = 62;
const TOLERANCE = 24;
const MAX_R = Math.max(SCREEN_W, SCREEN_H) * 0.58;
const INITIAL_DUR = 2200;
const MIN_DUR = 460;
const DUR_STEP = 55;

// How close the target ring center can get to the screen edges
const EDGE_PAD = TARGET_R + 28;

// Derived ring sizes
const GLOW_MID_R = TARGET_R + 14;
const GLOW_OUT_R = TARGET_R + 36;
const SHRINK_GLOW_EXTRA = 15;
const SHRINK_GLOW_FAINT_EXTRA = 36;

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#030310",
  bgMid: "#08082a",
  cyan: "#00FFE8",
  cyanFaint: "rgba(0,255,232,0.06)",
  cyanSoft: "rgba(0,255,232,0.15)",
  pink: "#FF0066",
  pinkFaint: "rgba(255,0,102,0.06)",
  pinkSoft: "rgba(255,0,102,0.15)",
  subtleText: "rgba(0,255,232,0.45)",
  overlayBg: "rgba(3,3,16,0.96)",
};

type Phase = "menu" | "playing" | "gameover";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomTargetPos(topInset: number, botInset: number) {
  const topY =
    (Platform.OS === "web" ? Math.max(topInset, 67) : topInset) + 170;
  const botY =
    SCREEN_H - (Platform.OS === "web" ? Math.max(botInset, 34) : botInset) - EDGE_PAD;
  const minX = EDGE_PAD;
  const maxX = SCREEN_W - EDGE_PAD;
  const minY = topY;
  const maxY = botY;
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
  };
}

// ─── Grid background ──────────────────────────────────────────────────────────
function GridBackground() {
  const lines: React.ReactNode[] = [];
  const step = 52;
  for (let x = 0; x <= SCREEN_W; x += step)
    lines.push(
      <View
        key={`v${x}`}
        style={[s.gridLine, { left: x, width: 1, height: SCREEN_H }]}
      />
    );
  for (let y = 0; y <= SCREEN_H; y += step)
    lines.push(
      <View
        key={`h${y}`}
        style={[s.gridLine, { top: y, height: 1, width: SCREEN_W }]}
      />
    );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {lines}
    </View>
  );
}

// ─── Target ring ──────────────────────────────────────────────────────────────
// Rendered inside an animated anchor View positioned at target center.
// Each child uses transform to center itself around (0,0) of the anchor.
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
      transform: [{ translateX: -TARGET_R }, { translateY: -TARGET_R }, { scale: scale.value }],
      borderColor: bc,
      shadowColor: bc,
    };
  });

  const glowMidStyle = useAnimatedStyle(() => {
    const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyanSoft, C.pinkSoft]);
    return {
      transform: [{ translateX: -GLOW_MID_R }, { translateY: -GLOW_MID_R }, { scale: scale.value }],
      borderColor: bc,
    };
  });

  const glowOutStyle = useAnimatedStyle(() => {
    const bc = interpolateColor(colorProgress.value, [0, 1], [C.cyanFaint, C.pinkFaint]);
    return {
      transform: [{ translateX: -GLOW_OUT_R }, { translateY: -GLOW_OUT_R }, { scale: scale.value }],
      backgroundColor: bc,
    };
  });

  return (
    <>
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
            width: TARGET_R * 2,
            height: TARGET_R * 2,
            borderRadius: TARGET_R,
            borderWidth: 3,
            shadowRadius: 18,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
          },
          ringStyle,
        ]}
      />
    </>
  );
}

// ─── Shrinking ring ───────────────────────────────────────────────────────────
// Also rendered inside the same anchor View — shares the same center.
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
    <>
      <Animated.View style={[s.shrinkGlowFaint, glowFaintStyle]} />
      <Animated.View style={[s.shrinkGlowMid, glowMidStyle]} />
      <Animated.View style={[s.shrinkRing, ringStyle]} />
    </>
  );
}

// ─── Rings anchor (animated to target position) ───────────────────────────────
function RingsAnchor({
  anchorX,
  anchorY,
  ringRadius,
  targetScale,
  targetColor,
}: {
  anchorX: SharedValue<number>;
  anchorY: SharedValue<number>;
  ringRadius: SharedValue<number>;
  targetScale: SharedValue<number>;
  targetColor: SharedValue<number>;
}) {
  const anchorStyle = useAnimatedStyle(() => ({
    left: anchorX.value,
    top: anchorY.value,
  }));

  return (
    <Animated.View
      style={[s.ringAnchor, anchorStyle]}
      pointerEvents="none"
    >
      <TargetRing scale={targetScale} colorProgress={targetColor} />
      <ShrinkingRing radius={ringRadius} />
    </Animated.View>
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

// ─── Main menu ────────────────────────────────────────────────────────────────
function MainMenu({
  onPlay,
  bestScore,
  topPad,
  botPad,
}: {
  onPlay: () => void;
  bestScore: number;
  topPad: number;
  botPad: number;
}) {
  return (
    <View style={[StyleSheet.absoluteFill, s.menuWrap]}>
      {bestScore > 0 && (
        <View style={[s.menuTopInfo, { top: topPad + 20 }]}>
          <Text style={s.menuBestLabel}>BEST</Text>
          <Text style={s.menuBestScore}>{bestScore}</Text>
        </View>
      )}

      <View style={s.menuCenter}>
        <Pressable
          onPress={onPlay}
          style={({ pressed }) => [s.playBtnOuter, pressed && s.playBtnPressed]}
        >
          <View style={s.playBtnInner}>
            <Text style={s.playText}>PLAY</Text>
          </View>
        </Pressable>
      </View>

      <View style={[s.menuBottom, { paddingBottom: botPad + 24 }]}>
        <Text style={s.menuHint}>TAP THE RING AT JUST THE RIGHT MOMENT</Text>
      </View>
    </View>
  );
}

// ─── Game over overlay ────────────────────────────────────────────────────────
function GameOverOverlay({
  score,
  bestScore,
  onRestart,
  onMenu,
}: {
  score: number;
  bestScore: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 420 });
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.gameOverWrap, style]}>
      <Text style={s.gameOverTitle}>GAME OVER</Text>
      <View style={s.separator} />
      <Text style={s.gameOverScoreLabel}>SCORE</Text>
      <Text style={s.gameOverScore}>{score}</Text>
      <Text style={s.bestLine}>BEST  {bestScore}</Text>

      <View style={s.gameOverButtons}>
        <Pressable
          onPress={onRestart}
          style={({ pressed }) => [s.goBtnOuter, s.goBtnPrimary, pressed && s.goBtnPressed]}
        >
          <Text style={[s.goBtnText, s.goBtnTextPrimary]}>RESTART</Text>
        </Pressable>

        <Pressable
          onPress={onMenu}
          style={({ pressed }) => [s.goBtnOuter, s.goBtnSecondary, pressed && s.goBtnPressed]}
        >
          <Text style={[s.goBtnText, s.goBtnTextSecondary]}>MAIN MENU</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Main game screen ─────────────────────────────────────────────────────────
export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("menu");
  const [finalScore, setFinalScore] = useState(0);

  const phaseRef = useRef<Phase>("menu");
  const scoreRef = useRef(0);
  const durRef = useRef(INITIAL_DUR);

  // Shared values
  const ringRadius = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const targetScale = useSharedValue(1);
  const targetColor = useSharedValue(0);
  const anchorX = useSharedValue(SCREEN_W / 2);
  const anchorY = useSharedValue(SCREEN_H / 2);

  useEffect(() => {
    AsyncStorage.getItem("antigravity_best").then((v) => {
      if (v) setBestScore(parseInt(v, 10));
    });
  }, []);

  const saveBest = useCallback(
    (s: number) => {
      AsyncStorage.getItem("antigravity_best").then((v) => {
        const prev = v ? parseInt(v, 10) : 0;
        if (s > prev) {
          AsyncStorage.setItem("antigravity_best", String(s));
          setBestScore(s);
        }
      });
    },
    []
  );

  const doGameOver = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "gameover";
    const s = scoreRef.current;
    setFinalScore(s);
    setPhase("gameover");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    saveBest(s);
  }, [saveBest]);

  const spawnRing = useCallback(
    (dur: number) => {
      // Pick a new random target position
      const pos = randomTargetPos(topPad, botPad);
      anchorX.value = pos.x;
      anchorY.value = pos.y;

      ringRadius.value = MAX_R;
      ringRadius.value = withTiming(
        0,
        { duration: dur, easing: Easing.linear },
        (done) => {
          if (done) runOnJS(doGameOver)();
        }
      );
    },
    [doGameOver, ringRadius, anchorX, anchorY, topPad, botPad]
  );

  const doHit = useCallback(() => {
    scoreRef.current += 1;
    setScore(scoreRef.current);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    flashOpacity.value = withSequence(
      withTiming(0.36, { duration: 50 }),
      withTiming(0, { duration: 200 })
    );
    targetScale.value = withSequence(
      withTiming(1.4, { duration: 65 }),
      withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) })
    );
    targetColor.value = withSequence(
      withTiming(1, { duration: 55 }),
      withTiming(0, { duration: 310 })
    );

    durRef.current = Math.max(MIN_DUR, durRef.current - DUR_STEP);
    spawnRing(durRef.current);
  }, [spawnRing, flashOpacity, targetScale, targetColor]);

  const beginGame = useCallback(() => {
    scoreRef.current = 0;
    durRef.current = INITIAL_DUR;
    phaseRef.current = "playing";
    setScore(0);
    setPhase("playing");
    spawnRing(INITIAL_DUR);
  }, [spawnRing]);

  const handleRestart = useCallback(() => {
    cancelAnimation(ringRadius);
    beginGame();
  }, [ringRadius, beginGame]);

  const handleMenu = useCallback(() => {
    cancelAnimation(ringRadius);
    ringRadius.value = 0;
    phaseRef.current = "menu";
    setPhase("menu");
  }, [ringRadius]);

  const handleScreenTap = useCallback(() => {
    if (phaseRef.current !== "playing") return;

    const r = ringRadius.value;
    const hit = r >= TARGET_R - TOLERANCE && r <= TARGET_R + TOLERANCE;
    cancelAnimation(ringRadius);
    if (hit) doHit();
    else doGameOver();
  }, [ringRadius, doHit, doGameOver]);

  const showRings = phase === "playing" || phase === "gameover";

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

      {/* Game tap zone — only active while playing */}
      {phase === "playing" && (
        <Pressable style={StyleSheet.absoluteFill} onPress={handleScreenTap} />
      )}

      {/* Score — visible while playing */}
      {phase === "playing" && (
        <View
          style={[s.scoreArea, { paddingTop: topPad + 16 }]}
          pointerEvents="none"
        >
          <Text style={s.scoreLabel}>SCORE</Text>
          <Text style={s.scoreValue}>{score}</Text>
          {bestScore > 0 && (
            <Text style={s.bestInline}>BEST  {bestScore}</Text>
          )}
        </View>
      )}

      {/* Rings — anchored to random target position */}
      {showRings && (
        <RingsAnchor
          anchorX={anchorX}
          anchorY={anchorY}
          ringRadius={ringRadius}
          targetScale={targetScale}
          targetColor={targetColor}
        />
      )}

      {/* Flash on hit */}
      <FlashOverlay opacity={flashOpacity} />

      {/* Main menu */}
      {phase === "menu" && (
        <MainMenu
          onPlay={beginGame}
          bestScore={bestScore}
          topPad={topPad}
          botPad={botPad}
        />
      )}

      {/* Game over */}
      {phase === "gameover" && (
        <GameOverOverlay
          score={finalScore}
          bestScore={bestScore}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
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

  // Rings anchor — absolutely positioned at target center (width/height 0)
  ringAnchor: {
    position: "absolute",
    width: 0,
    height: 0,
  },

  // Score
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

  // Shrinking ring visuals
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

  // ── Main menu ──
  menuWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  menuTopInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  menuBestLabel: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 10,
    letterSpacing: 5,
    color: C.subtleText,
    marginBottom: 2,
  },
  menuBestScore: {
    fontFamily: "Orbitron_900Black",
    fontSize: 48,
    color: C.cyan,
    lineHeight: 54,
    textShadowColor: C.cyan,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  menuCenter: {
    alignItems: "center",
  },
  playBtnOuter: {
    borderWidth: 2,
    borderColor: C.cyan,
    borderRadius: 4,
    shadowColor: C.cyan,
    shadowRadius: 20,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
  },
  playBtnPressed: {
    opacity: 0.75,
    shadowOpacity: 0.4,
  },
  playBtnInner: {
    paddingHorizontal: 52,
    paddingVertical: 18,
  },
  playText: {
    fontFamily: "Orbitron_900Black",
    fontSize: 26,
    letterSpacing: 10,
    color: C.cyan,
    textShadowColor: C.cyan,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  menuBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  menuHint: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(0,255,232,0.28)",
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // ── Game over ──
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
    backgroundColor: "rgba(0,255,232,0.22)",
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
    marginBottom: 40,
  },
  gameOverButtons: {
    gap: 14,
    alignItems: "center",
  },
  goBtnOuter: {
    borderRadius: 3,
    minWidth: 220,
    alignItems: "center",
  },
  goBtnPrimary: {
    borderWidth: 2,
    borderColor: C.cyan,
    shadowColor: C.cyan,
    shadowRadius: 14,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  goBtnSecondary: {
    borderWidth: 1,
    borderColor: C.pink,
    shadowColor: C.pink,
    shadowRadius: 10,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  goBtnPressed: {
    opacity: 0.7,
  },
  goBtnText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 13,
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
  goBtnTextPrimary: {
    color: C.cyan,
    textShadowColor: C.cyan,
    textShadowRadius: 10,
  },
  goBtnTextSecondary: {
    color: C.pink,
    textShadowColor: C.pink,
    textShadowRadius: 8,
  },
});
