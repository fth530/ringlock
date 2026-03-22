import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useFonts } from "expo-font";
import {
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from "@expo-google-fonts/orbitron";
import { Platform, AppState } from "react-native";
import { soundManager } from "@/lib/sounds";
import { musicManager } from "@/lib/music";
import { SettingsProvider, useSettings } from "@/lib/SettingsContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { initI18n } from "@/lib/i18n";

SplashScreen.preventAutoHideAsync();

function MusicController() {
  const { musicEnabled, loaded } = useSettings();
  useEffect(() => {
    if (!loaded) return; // Ayarlar yüklenene kadar müziği başlatma
    musicManager.setEnabled(musicEnabled);
  }, [musicEnabled, loaded]);
  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const fadeIn = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([soundManager.init(), musicManager.init(), initI18n()]);
      } catch (e) {
        // silent — app must always open regardless of permission outcome
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "background") musicManager.pause();
      else if (state === "active") musicManager.play();
    });

    return () => {
      appStateSub.remove();
      soundManager.release();
      musicManager.release();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && appIsReady) {
      SplashScreen.hideAsync();
      fadeIn.value = withTiming(1, { duration: 600 });
    }
  }, [fontsLoaded, appIsReady]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  if (!fontsLoaded || !appIsReady) return null;

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <MusicController />
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Animated.View style={[{ flex: 1 }, fadeStyle]}>
              <RootLayoutNav />
            </Animated.View>
          </GestureHandlerRootView>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
