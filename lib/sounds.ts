import { Platform } from "react-native";

// ─── Web Audio API sound synthesis ───────────────────────────────────────────
// Runs entirely in the browser — zero native package dependencies.
// On iOS/Android the manager is a no-op (silent); sounds are enhancement only.

type SoundKey = "success" | "gameover";

// Context is created lazily on first play to satisfy browser autoplay policy
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  try {
    if (!_ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC() as AudioContext;
    }
    return _ctx;
  } catch {
    return null;
  }
}

// ── Success: sharp ascending laser sweep ─────────────────────────────────────
function playSuccess(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(1800, t + 0.14);

  gain.gain.setValueAtTime(0.28, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

  osc.start(t);
  osc.stop(t + 0.22);
}

// ── Game Over: low heavy buzz ─────────────────────────────────────────────────
function playGameover(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Low rumble
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = "square";
  osc1.frequency.setValueAtTime(80, t);
  osc1.frequency.exponentialRampToValueAtTime(40, t + 0.5);
  gain1.gain.setValueAtTime(0.3, t);
  gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  osc1.start(t);
  osc1.stop(t + 0.5);

  // Harmonic
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(160, t);
  osc2.frequency.exponentialRampToValueAtTime(80, t + 0.4);
  gain2.gain.setValueAtTime(0.15, t);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc2.start(t);
  osc2.stop(t + 0.4);
}

// ─── Public API ───────────────────────────────────────────────────────────────

class SoundManager {
  // Pre-warm the AudioContext on web so first play has no latency
  init() {
    if (Platform.OS !== "web") return;
    try {
      getCtx();
    } catch {
      // Swallow — audio is enhancement only
    }
  }

  play(key: SoundKey) {
    if (Platform.OS !== "web") return;
    try {
      const ctx = getCtx();
      if (!ctx) return;
      if (key === "success") playSuccess(ctx);
      else if (key === "gameover") playGameover(ctx);
    } catch {
      // Never interrupt gameplay for audio errors
    }
  }

  release() {
    // No-op — Web Audio context is kept alive for the app lifetime
  }
}

export const soundManager = new SoundManager();
