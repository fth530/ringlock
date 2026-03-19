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
import { soundManager } from "@/lib/sounds";
import { musicManager } from "@/lib/music";
import { SettingsProvider, useSettings } from "@/lib/SettingsContext";
import { ThemeProvider } from "@/lib/ThemeContext";

SplashScreen.preventAutoHideAsync();

function MusicController() {
  const { musicEnabled } = useSettings();
  useEffect(() => {
    musicManager.setEnabled(musicEnabled);
  }, [musicEnabled]);
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
        await Promise.all([soundManager.init(), musicManager.init()]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    return () => {
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
