import { renderHook, act } from "@testing-library/react-native";
import { useGameLoop } from "./useGameLoop";

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("@/lib/sounds", () => ({
    soundManager: {
        init: jest.fn(),
        release: jest.fn(),
        play: jest.fn(),
    },
}));

jest.mock("@/lib/SettingsContext", () => ({
    useSettings: () => ({
        soundEnabled: true,
        vibrationEnabled: true,
        toggleSound: jest.fn(),
        toggleVibration: jest.fn(),
    }),
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

jest.mock("react-native-reanimated", () => {
    const Reanimated = require("react-native-reanimated/mock");
    Reanimated.default.call = () => { };
    return Reanimated;
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("useGameLoop", () => {
    it("should initialize with menu phase, score 0, and 3 lives", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        expect(result.current.phase).toBe("menu");
        expect(result.current.score).toBe(0);
        expect(result.current.lives).toBe(3);
        expect(result.current.combo).toBe(0);
        expect(result.current.visualPhase).toBe(1);
    });

    it("should transition to playing phase when beginGame is called", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        act(() => {
            result.current.beginGame();
        });
        expect(result.current.phase).toBe("playing");
        expect(result.current.score).toBe(0);
        expect(result.current.lives).toBe(3);
    });

    it("should reset all state on beginGame", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        act(() => {
            result.current.beginGame();
        });
        expect(result.current.score).toBe(0);
        expect(result.current.combo).toBe(0);
        expect(result.current.maxCombo).toBe(0);
        expect(result.current.hitQuality).toBeNull();
        expect(result.current.visualPhase).toBe(1);
        expect(result.current.lives).toBe(3);
    });

    it("should lose a life on miss (tap outside tolerance)", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        act(() => {
            result.current.beginGame();
        });
        // handleScreenTap will read ringRadius.value (0 by default in mock)
        // which is far from TARGET_R (62), so it's a miss
        act(() => {
            result.current.handleScreenTap();
        });
        // Should lose 1 life (3 → 2) but NOT game over
        expect(result.current.lives).toBe(2);
        expect(result.current.phase).toBe("playing");
    });

    it("should game over after 3 misses", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        act(() => {
            result.current.beginGame();
        });
        // 3 consecutive misses
        act(() => { result.current.handleScreenTap(); });
        act(() => { result.current.handleScreenTap(); });
        act(() => { result.current.handleScreenTap(); });

        expect(result.current.lives).toBe(0);
        expect(result.current.phase).toBe("gameover");
    });

    it("should reset combo on miss", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        act(() => {
            result.current.beginGame();
        });
        act(() => {
            result.current.handleScreenTap(); // miss
        });
        expect(result.current.combo).toBe(0);
    });

    it("should return to menu when handleMenu is called", () => {
        const { result } = renderHook(() => useGameLoop(0, 0));
        act(() => {
            result.current.beginGame();
        });
        act(() => {
            result.current.handleMenu();
        });
        expect(result.current.phase).toBe("menu");
    });
});
