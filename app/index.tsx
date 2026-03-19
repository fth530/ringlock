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

import { C, HitQuality, GameMode, GAME_MODES } from "@/constants/game";
import { useGameLoop } from "@/hooks/useGameLoop";
import { GridBackground } from "@/components/GridBackground";
import { MainMenu } from "@/components/MainMenu";
import { ModeSelect } from "@/components/ModeSelect";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { RingsAnchor, FlashOverlay } from "@/components/TargetRings";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { AchievementToast } from "@/components/AchievementToast";
import { AchievementsOverlay } from "@/components/AchievementsOverlay";
import { ScoresOverlay } from "@/components/ScoresOverlay";
import { ParticleEffect } from "@/components/ParticleEffect";
import { TutorialOverlay, shouldShowTutorial } from "@/components/TutorialOverlay";
import { ThemeOverlay } from "@/components/ThemeOverlay";
import { DailyChallengeOverlay } from "@/components/DailyChallengeOverlay";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";

// ─── Hit Quality Label ────────────────────────────────────────────────────────
function HitQualityLabel({ quality }: { quality: HitQuality }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const { largeText, highContrast } = useSettings();

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
    quality === "perfect" ? "MÜKEMMEL" : quality === "good" ? "İYİ" : "GEÇ";
  const color =
    quality === "perfect" ? C.gold : quality === "good" ? C.cyan : C.pink;
  const fontSize = largeText ? 40 : 28;

  return (
    <Animated.View style={[s.hitQualityWrap, animStyle]} pointerEvents="none">
      <Text style={[s.hitQualityText, { color, fontSize, opacity: highContrast ? 1 : 0.92 }]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Combo Counter ────────────────────────────────────────────────────────────
function ComboCounter({ combo }: { combo: number }) {
  const scale = useSharedValue(1);
  const { largeText } = useSettings();

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
    combo >= 10 ? "İNANILMAZ" : combo >= 5 ? "HARİKA" : combo >= 3 ? "İYİ" : "";
  const fontSize = largeText ? 42 : 32;

  return (
    <Animated.View style={[s.comboWrap, animStyle]} pointerEvents="none">
      <Text style={[s.comboCount, { color: comboColor, fontSize }]}>{combo}x</Text>
      {comboLabel !== "" && (
        <Text style={[s.comboLabel, { color: comboColor }]}>{comboLabel}</Text>
      )}
    </Animated.View>
  );
}

// ─── Lives Display ────────────────────────────────────────────────────────────
function LivesDisplay({ lives, maxLives, topPad }: { lives: number; maxLives: number; topPad: number }) {
  if (maxLives === 0) return null;
  return (
    <View style={[s.livesWrap, { top: topPad + 12 }]} pointerEvents="none">
      {Array.from({ length: maxLives }).map((_, i) => (
        <Text
          key={i}
          style={[s.heartIcon, { opacity: i < lives ? 1 : 0.2 }]}
        >
          ❤️
        </Text>
      ))}
    </View>
  );
}

// ─── Timer Display (Speed mode) ──────────────────────────────────────────────
function TimerDisplay({ timeLeft, topPad }: { timeLeft: number; topPad: number }) {
  const isLow = timeLeft <= 10;
  return (
    <View style={[s.timerWrap, { top: topPad + 12 }]} pointerEvents="none">
      <Text style={[s.timerText, isLow && { color: C.pink }]}>{timeLeft}s</Text>
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
  const { activeRing, activeBg } = useTheme();
  const { largeText, highContrast } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);

  const {
    score, bestScore, phase, finalScore,
    combo, maxCombo, hitQuality, lives, visualPhase,
    gameMode, timeLeft, newAchievements,
    perfectTrigger, perfectPos, isNewRecord,
    isDualMode,
    ringRadius, flashOpacity, targetScale, targetColor, anchorX, anchorY,
    ringRadius2, anchorX2, anchorY2, targetScale2, targetColor2,
    shakeAnim,
    beginGame, handleRestart, handleMenu, handleScreenTap,
  } = useGameLoop(topPad, botPad);

  const [toastIndex, setToastIndex] = useState(0);

  // Check if tutorial should be shown on first launch
  useEffect(() => {
    shouldShowTutorial().then((show) => {
      if (show) setShowTutorial(true);
    });
  }, []);

  useEffect(() => {
    if (newAchievements.length > 0) setToastIndex(0);
  }, [newAchievements]);

  const modeConfig = GAME_MODES[gameMode];
  const showRings = phase === "playing" || phase === "gameover";
  const bgColors = visualPhase <= 1 ? activeBg.colors : getPhaseColors(visualPhase);

  const onPlay = () => setShowModeSelect(true);
  const onModeSelect = (mode: GameMode) => {
    setShowModeSelect(false);
    beginGame(mode);
  };
  const onModeBack = () => setShowModeSelect(false);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  return (
    <Animated.View style={[s.root, shakeStyle]}>
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
      {phase === "playing" && (
        <LivesDisplay lives={lives} maxLives={modeConfig.lives} topPad={topPad} />
      )}

      {/* Timer — top left (speed mode, replaces lives) */}
      {phase === "playing" && modeConfig.timeLimitSec > 0 && (
        <TimerDisplay timeLeft={timeLeft} topPad={topPad} />
      )}

      {/* Mode badge / quit button — top right during gameplay */}
      {phase === "playing" && gameMode !== "classic" && (
        <View style={[s.modeBadge, { top: topPad + 14 }]}>
          {modeConfig.lives === 0 ? (
            <Pressable
              onPress={handleMenu}
              hitSlop={14}
              style={({ pressed }) => [s.quitBtn, { borderColor: `${getModeColor(gameMode)}40` }, pressed && { opacity: 0.5 }]}
            >
              <Text style={[s.quitIcon, { color: getModeColor(gameMode) }]}>←</Text>
              <Text style={[s.quitLabel, { color: getModeColor(gameMode) }]}>CIK</Text>
            </Pressable>
          ) : (
            <Text style={[s.modeBadgeText, { color: getModeColor(gameMode) }]}>
              {modeConfig.label}
            </Text>
          )}
        </View>
      )}

      {/* Score */}
      {phase === "playing" && (
        <View
          style={[s.scoreArea, { paddingTop: topPad + 14 }]}
          pointerEvents="none"
        >
          <View style={s.scoreBox}>
            <Text style={s.scoreLabel}>SKOR</Text>
            <Text style={[s.scoreValue, largeText && { fontSize: 58, lineHeight: 64 }, highContrast && { color: "#FFFFFF" }]}>{score}</Text>
            {bestScore > 0 && (
              <>
                <View style={s.scoreDivider} />
                <Text style={[s.bestInline, highContrast && { color: "rgba(255,255,255,0.6)" }]}>EN İYİ  {bestScore}</Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Combo counter */}
      {phase === "playing" && <ComboCounter combo={combo} />}

      {/* Hit quality */}
      {phase === "playing" && <HitQualityLabel quality={hitQuality} />}

      {/* Primary ring */}
      {showRings && (
        <RingsAnchor
          anchorX={anchorX}
          anchorY={anchorY}
          ringRadius={ringRadius}
          targetScale={targetScale}
          targetColor={targetColor}
          ringColor={activeRing.color}
          thick={highContrast}
        />
      )}

      {/* Secondary ring (dual mode only) */}
      {showRings && isDualMode && (
        <RingsAnchor
          anchorX={anchorX2}
          anchorY={anchorY2}
          ringRadius={ringRadius2}
          targetScale={targetScale2}
          targetColor={targetColor2}
          ringColor={activeRing.color}
          thick={highContrast}
        />
      )}

      {/* Flash */}
      <FlashOverlay opacity={flashOpacity} />

      {/* Particle effects on PERFECT hit */}
      {phase === "playing" && perfectTrigger > 0 && (
        <ParticleEffect key={perfectTrigger} cx={perfectPos.x} cy={perfectPos.y} />
      )}

      {/* Main menu + settings gear */}
      {phase === "menu" && !showModeSelect && (
        <>
          <MainMenu
            onPlay={onPlay}
            onAchievements={() => setShowAchievements(true)}
            onScores={() => setShowScores(true)}
            onSettings={() => setShowSettings(true)}
            onTheme={() => setShowTheme(true)}
            onDailyChallenge={() => setShowDailyChallenge(true)}
            bestScore={bestScore}
            topPad={topPad}
            botPad={botPad}
          />
        </>
      )}

      {/* Mode selection */}
      {phase === "menu" && showModeSelect && (
        <ModeSelect onSelect={onModeSelect} onBack={onModeBack} />
      )}

      {/* Game over */}
      {phase === "gameover" && (
        <GameOverOverlay
          score={finalScore}
          bestScore={bestScore}
          maxCombo={maxCombo}
          gameMode={gameMode}
          isNewRecord={isNewRecord}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}

      {/* Settings overlay */}
      {showSettings && (
        <SettingsOverlay onClose={() => setShowSettings(false)} />
      )}

      {/* Scores overlay */}
      {showScores && (
        <ScoresOverlay onClose={() => setShowScores(false)} />
      )}

      {/* Achievements overlay */}
      {showAchievements && (
        <AchievementsOverlay onClose={() => setShowAchievements(false)} />
      )}

      {/* Achievement toast */}
      {newAchievements.length > 0 && toastIndex < newAchievements.length && (
        <AchievementToast
          key={newAchievements[toastIndex].id}
          achievement={newAchievements[toastIndex]}
          onDone={() => setToastIndex((i) => i + 1)}
        />
      )}

      {/* Tutorial overlay — shown on first launch */}
      {showTutorial && (
        <TutorialOverlay onDone={() => setShowTutorial(false)} />
      )}

      {/* Theme overlay */}
      {showTheme && (
        <ThemeOverlay onClose={() => setShowTheme(false)} />
      )}

      {/* Daily Challenge overlay */}
      {showDailyChallenge && (
        <DailyChallengeOverlay onClose={() => setShowDailyChallenge(false)} />
      )}
    </Animated.View>
  );
}

function getModeColor(mode: GameMode): string {
  switch (mode) {
    case "hardcore": return C.pink;
    case "zen": return C.purple;
    case "speed": return C.gold;
    default: return C.cyan;
  }
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
  scoreBox: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  scoreLabel: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 9,
    letterSpacing: 6,
    color: C.subtleText,
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: "Orbitron_900Black",
    fontSize: 44,
    color: C.cyan,
    lineHeight: 50,
  },
  scoreDivider: {
    width: 30,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,255,232,0.15)",
    marginVertical: 6,
  },
  bestInline: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 9,
    letterSpacing: 4,
    color: C.subtleText,
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
  heartIcon: {
    fontSize: 16,
  },
  timerWrap: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  timerText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 16,
    color: C.cyan,
    letterSpacing: 2,
  },
  modeBadge: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  modeBadgeText: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 9,
    letterSpacing: 3,
  },
  quitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quitIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  quitLabel: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 9,
    letterSpacing: 2,
  },
});
