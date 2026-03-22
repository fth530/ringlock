import { Platform } from "react-native";

// ─── Config ──────────────────────────────────────────────────────────────────
const GAMES_BETWEEN_INTERSTITIAL = 3;

// Native modül yoksa (Expo Go) sessizce devre disi kal
let AdsModule: typeof import("react-native-google-mobile-ads") | null = null;
try {
    AdsModule = require("react-native-google-mobile-ads");
} catch {
    // Expo Go'da native modül yok — reklamlar devre disi
}

function getRewardedId(): string {
    if (!AdsModule) return "";
    return __DEV__
        ? AdsModule.TestIds.REWARDED
        : "ca-app-pub-3876117181338566/1819108698";
}

function getInterstitialId(): string {
    if (!AdsModule) return "";
    return __DEV__
        ? AdsModule.TestIds.INTERSTITIAL
        : "ca-app-pub-3876117181338566/8156719089";
}

// ─── Init ────────────────────────────────────────────────────────────────────
let initialized = false;

export async function initAds(): Promise<void> {
    if (initialized || !AdsModule) return;
    try {
        const { MobileAds, MaxAdContentRating } = AdsModule;
        await MobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.G,
            tagForChildDirectedTreatment: true,
            tagForUnderAgeOfConsent: true,
        });
        await MobileAds().initialize();
        initialized = true;
        preloadRewarded();
        preloadInterstitial();
    } catch {}
}

// ─── Rewarded Ad (Reklam izle → +1 can) ─────────────────────────────────────
let rewarded: any = null;
let rewardedLoaded = false;

function preloadRewarded() {
    if (!AdsModule) return;
    const { RewardedAd, RewardedAdEventType, AdEventType } = AdsModule;

    rewarded = RewardedAd.createForAdRequest(getRewardedId(), {
        requestNonPersonalizedAdsOnly: true,
    });

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewardedLoaded = true;
    });

    rewarded.addAdEventListener(AdEventType.ERROR, () => {
        rewardedLoaded = false;
    });

    rewarded.load();
}

export function isRewardedReady(): boolean {
    return rewardedLoaded;
}

export function showRewarded(
    onReward: () => void,
    onClose: () => void
): void {
    if (!AdsModule || !rewarded || !rewardedLoaded) {
        onClose();
        return;
    }
    const { RewardedAdEventType, AdEventType } = AdsModule;

    const unsubEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => { onReward(); }
    );

    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        unsubEarned();
        unsubClosed();
        onClose();
        rewardedLoaded = false;
        rewarded = null;
        preloadRewarded();
    });

    rewarded.show();
}

// ─── Interstitial Ad (her N oyunda bir) ──────────────────────────────────────
let interstitial: any = null;
let interstitialLoaded = false;
let gamesSinceLastAd = 0;

function preloadInterstitial() {
    if (!AdsModule) return;
    const { InterstitialAd, AdEventType } = AdsModule;

    interstitial = InterstitialAd.createForAdRequest(getInterstitialId(), {
        requestNonPersonalizedAdsOnly: true,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoaded = true;
    });

    interstitial.addAdEventListener(AdEventType.ERROR, () => {
        interstitialLoaded = false;
    });

    interstitial.load();
}

export function trackGameForInterstitial(): boolean {
    gamesSinceLastAd += 1;
    if (gamesSinceLastAd >= GAMES_BETWEEN_INTERSTITIAL && interstitialLoaded) {
        return true;
    }
    return false;
}

export function showInterstitial(onClose: () => void): void {
    if (!AdsModule || !interstitial || !interstitialLoaded) {
        onClose();
        return;
    }
    const { AdEventType } = AdsModule;

    const unsubClosed = interstitial.addAdEventListener(
        AdEventType.CLOSED,
        () => {
            unsubClosed();
            onClose();
            interstitialLoaded = false;
            interstitial = null;
            gamesSinceLastAd = 0;
            preloadInterstitial();
        }
    );

    interstitial.show();
}
