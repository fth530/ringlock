export const TARGET_R = 62;
export const TOLERANCE = 18;
export const INITIAL_DUR = 2200;
export const MIN_DUR = 460;
export const DUR_STEP = 48;

export const EDGE_PAD = TARGET_R + 28;

export const GLOW_MID_R = TARGET_R + 14;
export const GLOW_OUT_R = TARGET_R + 36;

// ─── Hit Quality Thresholds ──────────────────────────────────────────────────
export const PERFECT_THRESHOLD = 5;   // ±5px = PERFECT
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
  overlayBg: "rgba(3,3,16,0.96)",
  gold: "#FFD700",
  purple: "#A855F7",
  purpleMid: "#1a0a2e",
};

export type Phase = "menu" | "playing" | "gameover";
export type HitQuality = "perfect" | "good" | "late" | null;
