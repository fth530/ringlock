/**
 * gameReducer — Pure function unit tests.
 * Hiç mock'a ihtiyaç duymaz, doğrudan import edip test eder.
 */
import { gameReducer, GameState, INITIAL_STATE } from "./useGameLoop";
import {
    INITIAL_DUR, MIN_DUR, DUR_STEP, MAX_LIVES, COMBO_FOR_EXTRA_LIFE,
} from "../constants/game";

// ─── Mocks: sadece native modüller için minimum stub ────────────────────────
jest.mock("react-native-worklets", () => ({}));
jest.mock("react-native-reanimated", () => ({
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (v: number) => v,
    withSequence: (...a: number[]) => a[a.length - 1],
    cancelAnimation: jest.fn(),
    runOnJS: (fn: Function) => fn,
    Easing: { linear: jest.fn(), out: () => jest.fn(), quad: jest.fn() },
    interpolateColor: () => "#000",
}));
jest.mock("expo-haptics", () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    ImpactFeedbackStyle: { Heavy: "heavy", Medium: "medium", Light: "light" },
    NotificationFeedbackType: { Error: "error", Warning: "warning" },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock("../lib/sounds", () => ({
    soundManager: { init: jest.fn(), release: jest.fn(), play: jest.fn() },
}));
jest.mock("../lib/SettingsContext", () => ({
    useSettings: () => ({
        soundEnabled: true, vibrationEnabled: true,
        toggleSound: jest.fn(), toggleVibration: jest.fn(),
    }),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("gameReducer", () => {
    it("should load best score on LOAD_BEST", () => {
        const state = gameReducer(INITIAL_STATE, { type: "LOAD_BEST", bestScore: 999 });
        expect(state.bestScore).toBe(999);
    });

    it("should transition to playing on BEGIN", () => {
        const next = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        expect(next.phase).toBe("playing");
        expect(next.score).toBe(0);
        expect(next.lives).toBe(MAX_LIVES);
        expect(next.combo).toBe(0);
        expect(next.maxCombo).toBe(0);
        expect(next.visualPhase).toBe(1);
        expect(next.duration).toBe(INITIAL_DUR);
    });

    it("should reset state on BEGIN from gameover", () => {
        const gameover: GameState = {
            ...INITIAL_STATE, phase: "gameover", score: 50,
            combo: 5, lives: 0, finalScore: 50, visualPhase: 4,
        };
        const next = gameReducer(gameover, { type: "BEGIN" });
        expect(next.phase).toBe("playing");
        expect(next.score).toBe(0);
        expect(next.lives).toBe(MAX_LIVES);
    });

    it("should increment score and combo on HIT", () => {
        const playing = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        const next = gameReducer(playing, { type: "HIT", quality: "perfect" });
        expect(next.score).toBe(1);
        expect(next.combo).toBe(1);
        expect(next.hitQuality).toBe("perfect");
    });

    it("should track maxCombo across hits and misses", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        for (let i = 0; i < 5; i++)
            state = gameReducer(state, { type: "HIT", quality: "good" });
        expect(state.combo).toBe(5);
        expect(state.maxCombo).toBe(5);

        state = gameReducer(state, { type: "MISS" });
        expect(state.combo).toBe(0);
        expect(state.maxCombo).toBe(5);
    });

    it("should reduce duration on HIT by DUR_STEP", () => {
        const playing = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        const next = gameReducer(playing, { type: "HIT", quality: "good" });
        expect(next.duration).toBe(INITIAL_DUR - DUR_STEP);
    });

    it("should not reduce duration below MIN_DUR", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = { ...state, duration: MIN_DUR + 10 };
        state = gameReducer(state, { type: "HIT", quality: "good" });
        expect(state.duration).toBe(MIN_DUR);
    });

    it("should increase duration on MISS (penalty slowdown)", () => {
        const playing = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        const next = gameReducer(playing, { type: "MISS" });
        expect(next.duration).toBe(INITIAL_DUR + 20);
    });

    it("should lose a life on MISS", () => {
        const playing = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        const next = gameReducer(playing, { type: "MISS" });
        expect(next.lives).toBe(MAX_LIVES - 1);
        expect(next.phase).toBe("playing");
        expect(next.combo).toBe(0);
    });

    it("should game over when last life is lost", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = { ...state, lives: 1, score: 42 };
        state = gameReducer(state, { type: "MISS" });
        expect(state.lives).toBe(0);
        expect(state.phase).toBe("gameover");
        expect(state.finalScore).toBe(42);
    });

    it("should game over after 3 consecutive misses", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = gameReducer(state, { type: "MISS" });
        state = gameReducer(state, { type: "MISS" });
        state = gameReducer(state, { type: "MISS" });
        expect(state.lives).toBe(0);
        expect(state.phase).toBe("gameover");
    });

    it("should update bestScore on game over if score is higher", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = { ...state, lives: 1, score: 100, bestScore: 50 };
        state = gameReducer(state, { type: "MISS" });
        expect(state.bestScore).toBe(100);
    });

    it("should NOT update bestScore if score is lower", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = { ...state, lives: 1, score: 30, bestScore: 50 };
        state = gameReducer(state, { type: "MISS" });
        expect(state.bestScore).toBe(50);
    });

    it("should transition visual phase at score thresholds", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        for (let i = 0; i < 10; i++)
            state = gameReducer(state, { type: "HIT", quality: "good" });
        expect(state.visualPhase).toBe(2);

        for (let i = 0; i < 15; i++)
            state = gameReducer(state, { type: "HIT", quality: "good" });
        expect(state.visualPhase).toBe(3);

        for (let i = 0; i < 25; i++)
            state = gameReducer(state, { type: "HIT", quality: "good" });
        expect(state.visualPhase).toBe(4);
    });

    it("should grant extra life at COMBO_FOR_EXTRA_LIFE", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = { ...state, lives: 2 };
        for (let i = 0; i < COMBO_FOR_EXTRA_LIFE; i++)
            state = gameReducer(state, { type: "HIT", quality: "perfect" });
        expect(state.lives).toBe(3);
    });

    it("should NOT exceed MAX_LIVES on extra life", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        for (let i = 0; i < COMBO_FOR_EXTRA_LIFE; i++)
            state = gameReducer(state, { type: "HIT", quality: "perfect" });
        expect(state.lives).toBe(MAX_LIVES);
    });

    it("should return to menu on MENU action", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = gameReducer(state, { type: "MENU" });
        expect(state.phase).toBe("menu");
    });

    it("should preserve hit quality types correctly", () => {
        const playing = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        expect(gameReducer(playing, { type: "HIT", quality: "perfect" }).hitQuality).toBe("perfect");
        expect(gameReducer(playing, { type: "HIT", quality: "good" }).hitQuality).toBe("good");
        expect(gameReducer(playing, { type: "HIT", quality: "late" }).hitQuality).toBe("late");
    });

    it("should clear hitQuality on MISS", () => {
        let state = gameReducer(INITIAL_STATE, { type: "BEGIN" });
        state = gameReducer(state, { type: "HIT", quality: "perfect" });
        expect(state.hitQuality).toBe("perfect");
        state = gameReducer(state, { type: "MISS" });
        expect(state.hitQuality).toBeNull();
    });
});
