import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Text, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, HitQuality } from "@/constants/game";
import { useGameLoop } from "@/hooks/useGameLoop";
import { GridBackground } from "@/components/GridBackground";
import { MainMenu } from "@/components/MainMenu";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { RingsAnchor, FlashOverlay } from "@/components/TargetRings";
import { SettingsOverlay } from "@/components/SettingsOverlay";

// ─── Hit Quality Label ────────────────────────────────────────────────────────
function HitQualityLabel({ quality }: { quality: HitQuality }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (quality) {
      opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
      );
      scale.value = withSequence(
        withTiming(1.3, { duration: 80 }),
        withTiming(0.8, { duration: 600, easing: Easing.out(Easing.quad) })
      );
    }
  }, [quality]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!quality) return null;

  const label =
    quality === "perfect" ? "PERFECT" : quality === "good" ? "GOOD" : "LATE";
  const color =
    quality === "perfect" ? C.gold : quality === "good" ? C.cyan : C.pink;

  return (
    <Animated.View style={[s.hitQualityWrap, animStyle]} pointerEvents="none">
      <Text style={[s.hitQualityText, { color }]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Combo Counter ────────────────────────────────────────────────────────────
function ComboCounter({ combo }: { combo: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (combo > 1) {
      scale.value = withSequence(
        withTiming(1.4, { duration: 60 }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) })
      );
    }
  }, [combo]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (combo < 2) return null;
  const comboColor = combo >= 10 ? C.gold : combo >= 5 ? C.pink : C.cyan;
  const comboLabel =
    combo >= 10 ? "INSANE" : combo >= 5 ? "GREAT" : combo >= 3 ? "GOOD" : "";

  return (
    <Animated.View style={[s.comboWrap, animStyle]} pointerEvents="none">
      <Text style={[s.comboCount, { color: comboColor }]}>{combo}x</Text>
      {comboLabel !== "" && (
        <Text style={[s.comboLabel, { color: comboColor }]}>{comboLabel}</Text>
      )}
    </Animated.View>
  );
}

// ─── Lives Display ────────────────────────────────────────────────────────────
function LivesDisplay({ lives, topPad }: { lives: number; topPad: number }) {
  return (
    <View style={[s.livesWrap, { top: topPad + 12 }]} pointerEvents="none">
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          style={[
            s.heartDot,
            { backgroundColor: i < lives ? C.pink : "rgba(255,0,102,0.2)" },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Background phases ───────────────────────────────────────────────────────
function getPhaseColors(visualPhase: number): [string, string, string] {
  switch (visualPhase) {
    case 2: return ["#050520", "#0a0a3a", "#050520"];
    case 3: return ["#0a0318", "#1a0630", "#0a0318"];
    case 4: return ["#100520", C.purpleMid, "#100520"];
    default: return [C.bg, C.bgMid, C.bg];
  }
}

// ─── Main Game Screen ─────────────────────────────────────────────────────────
export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;
  const [showSettings, setShowSettings] = useState(false);

  const {
    score, bestScore, phase, finalScore,
    combo, maxCombo, hitQuality, lives, visualPhase,
    ringRadius, flashOpacity, targetScale, targetColor, anchorX, anchorY,
    beginGame, handleRestart, handleMenu, handleScreenTap,
  } = useGameLoop(topPad, botPad);

  const showRings = phase === "playing" || phase === "gameover";
  const bgColors = getPhaseColors(visualPhase);

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={bgColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <GridBackground />

      {/* Game tap zone */}
      {phase === "playing" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tap Screen to Hit"
          style={StyleSheet.absoluteFill}
          onPress={handleScreenTap}
        />
      )}

      {/* Lives — top left */}
      {phase === "playing" && <LivesDisplay lives={lives} topPad={topPad} />}

      {/* Score — Android-safe: no textShadow */}
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

      {/* Combo counter */}
      {phase === "playing" && <ComboCounter combo={combo} />}

      {/* Hit quality */}
      {phase === "playing" && <HitQualityLabel quality={hitQuality} />}

      {/* Rings */}
      {showRings && (
        <RingsAnchor
          anchorX={anchorX}
          anchorY={anchorY}
          ringRadius={ringRadius}
          targetScale={targetScale}
          targetColor={targetColor}
        />
      )}

      {/* Flash */}
      <FlashOverlay opacity={flashOpacity} />

      {/* Main menu + settings gear */}
      {phase === "menu" && (
        <>
          <MainMenu
            onPlay={beginGame}
            bestScore={bestScore}
            topPad={topPad}
            botPad={botPad}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            style={[s.settingsBtn, { top: topPad + 14 }]}
            onPress={() => setShowSettings(true)}
          >
            <Text style={s.settingsIcon}>⚙</Text>
          </Pressable>
        </>
      )}

      {/* Game over */}
      {phase === "gameover" && (
        <GameOverOverlay
          score={finalScore}
          bestScore={bestScore}
          maxCombo={maxCombo}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}

      {/* Settings overlay */}
      {showSettings && (
        <SettingsOverlay onClose={() => setShowSettings(false)} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
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
    fontSize: 48,
    color: C.cyan,
    lineHeight: 56,
    // Android'de textShadow büyük boy fontlarda kare render yapıyor
    // Bu yüzden sadece iOS'ta shadow kullanıyoruz
    ...(Platform.OS === "ios"
      ? {
        textShadowColor: C.cyan,
        textShadowRadius: 14,
        textShadowOffset: { width: 0, height: 0 },
      }
      : {}),
  },
  bestInline: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 11,
    letterSpacing: 4,
    color: C.subtleText,
    marginTop: 4,
  },
  hitQualityWrap: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  hitQualityText: {
    fontFamily: "Orbitron_900Black",
    fontSize: 28,
    letterSpacing: 8,
  },
  comboWrap: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  comboCount: {
    fontFamily: "Orbitron_900Black",
    fontSize: 32,
  },
  comboLabel: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 12,
    letterSpacing: 4,
    marginTop: 2,
  },
  livesWrap: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  heartDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  settingsBtn: {
    position: "absolute",
    right: 20,
    zIndex: 20,
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
    color: C.subtleText,
  },
});
