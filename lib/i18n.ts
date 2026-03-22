import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "@/locales/en";
import tr from "@/locales/tr";
import pt from "@/locales/pt";
import es from "@/locales/es";
import id from "@/locales/id";
import ja from "@/locales/ja";
import hi from "@/locales/hi";

export const LANGUAGE_KEY = "ringlock_language";
export const ONBOARDING_DONE_KEY = "ringlock_lang_onboarding_done";

export type LangCode = "en" | "tr" | "pt" | "es" | "id" | "ja" | "hi";

export interface LanguageOption {
    code: LangCode;
    name: string;
    nativeName: string;
    flag: string;
}

export const LANGUAGES: LanguageOption[] = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
];

const resources = {
    en: { translation: en },
    tr: { translation: tr },
    pt: { translation: pt },
    es: { translation: es },
    id: { translation: id },
    ja: { translation: ja },
    hi: { translation: hi },
};

function getDeviceLanguage(): LangCode {
    const locale = Localization.getLocales()[0]?.languageCode ?? "en";
    const supported: LangCode[] = ["en", "tr", "pt", "es", "id", "ja", "hi"];
    return supported.includes(locale as LangCode) ? (locale as LangCode) : "en";
}

export async function initI18n(): Promise<void> {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    const lng = (saved as LangCode) ?? getDeviceLanguage();

    await i18next.use(initReactI18next).init({
        resources,
        lng,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        compatibilityJSON: "v4",
    });
}

export async function changeLanguage(code: LangCode): Promise<void> {
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
    await i18next.changeLanguage(code);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
    const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
    return done === "1";
}

export async function markOnboardingDone(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, "1");
}

export default i18next;
