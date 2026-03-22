import { Dimensions } from "react-native";

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export const TARGET_R = 62;
export const TOLERANCE = 18;
export const MAX_R = Math.max(SCREEN_W, SCREEN_H) * 0.58;
export const INITIAL_DUR = 2200;
export const MIN_DUR = 460;
export const DUR_STEP = 48;

export const EDGE_PAD = TARGET_R + 28;
export const MIRROR_MAX_R = TARGET_R * 3.2;  // Mirror modda halka bu kadar buyur (klasik MAX_R cok buyuk)

export const GLOW_MID_R = TARGET_R + 14;
export const GLOW_OUT_R = TARGET_R + 36;
export const SHRINK_GLOW_EXTRA = 15;
export const SHRINK_GLOW_FAINT_EXTRA = 36;

// ─── Hit Quality Thresholds ──────────────────────────────────────────────────
export const PERFECT_THRESHOLD = 5;   // ±5px = PERFECT (neredeyse birebir üst üste)
export const GOOD_THRESHOLD = 10;     // ±10px = GOOD

// ─── Lives ──────────────────────────────────────────────────────────────────
export const MAX_LIVES = 3;
export const COMBO_FOR_EXTRA_LIFE = 15;

// ─── Visual Phase Milestones ────────────────────────────────────────────────
export const PHASE_2_SCORE = 10;
export const PHASE_3_SCORE = 25;
export const PHASE_4_SCORE = 50;

// ─── Palette ────────────────────────────────────────────────────────────────
export const C = {
  bg: "#030310",
  bgMid: "#08082a",
  cyan: "#00FFE8",
  cyanFaint: "rgba(0,255,232,0.06)",
  cyanSoft: "rgba(0,255,232,0.15)",
  pink: "#FF0066",
  pinkFaint: "rgba(255,0,102,0.06)",
  pinkSoft: "rgba(255,0,102,0.15)",
  subtleText: "rgba(0,255,232,0.45)",
  overlayBg: "rgba(3,3,16,1)",
  gold: "#FFD700",
  purple: "#A855F7",
  purpleMid: "#1a0a2e",
};

export type Phase = "menu" | "playing" | "gameover";
export type HitQuality = "perfect" | "good" | "late" | null;

// ─── Game Modes ──────────────────────────────────────────────────────────────
export type GameMode = "classic" | "hardcore" | "zen" | "speed" | "mirror" | "dual" | "chaos";

export interface GameModeConfig {
  key: GameMode;
  label: string;
  description: string;
  lives: number;        // 0 = infinite
  timeLimitSec: number; // 0 = no limit
  initialDur: number;
  minDur: number;
  durStep: number;
  isMirror?: boolean;   // ring grows instead of shrinks
  isDual?: boolean;     // two rings simultaneously
  isChaos?: boolean;    // random speed each ring
  unlockScore?: number; // any-mode best score needed to unlock
  unlockByAd?: boolean; // reklam izleyerek acilabilir
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    key: "classic",
    label: "CLASSIC",
    description: "3 can, artan zorluk",
    lives: MAX_LIVES,
    timeLimitSec: 0,
    initialDur: INITIAL_DUR,
    minDur: MIN_DUR,
    durStep: DUR_STEP,
  },
  hardcore: {
    key: "hardcore",
    label: "HARDCORE",
    description: "1 can, hata yok",
    lives: 1,
    timeLimitSec: 0,
    initialDur: INITIAL_DUR,
    minDur: MIN_DUR,
    durStep: DUR_STEP,
  },
  zen: {
    key: "zen",
    label: "ZEN",
    description: "Can yok, rahat oyna",
    lives: 0,
    timeLimitSec: 0,
    initialDur: INITIAL_DUR + 400,
    minDur: MIN_DUR + 100,
    durStep: DUR_STEP - 12,
  },
  speed: {
    key: "speed",
    label: "SPEED RUSH",
    description: "30 saniye, hızlı başla",
    lives: 0,
    timeLimitSec: 30,
    initialDur: 1200,
    minDur: MIN_DUR,
    durStep: DUR_STEP + 10,
  },
  mirror: {
    key: "mirror",
    label: "AYNA",
    description: "Halka büyüyor — ters mekanik",
    lives: MAX_LIVES,
    timeLimitSec: 0,
    initialDur: INITIAL_DUR + 600,
    minDur: MIN_DUR + 200,
    durStep: DUR_STEP - 16,
    isMirror: true,
    unlockScore: 10,
    unlockByAd: true,
  },
  dual: {
    key: "dual",
    label: "İKİZ",
    description: "2 halka, tek dokunuş",
    lives: MAX_LIVES,
    timeLimitSec: 0,
    initialDur: INITIAL_DUR + 400,
    minDur: MIN_DUR + 100,
    durStep: DUR_STEP - 10,
    isDual: true,
    unlockScore: 25,
    unlockByAd: true,
  },
  chaos: {
    key: "chaos",
    label: "CHAOS",
    description: "Rastgele hız — her halka sürpriz",
    lives: MAX_LIVES,
    timeLimitSec: 0,
    initialDur: INITIAL_DUR,
    minDur: MIN_DUR,
    durStep: DUR_STEP,
    isChaos: true,
    unlockByAd: true,
  },
};
