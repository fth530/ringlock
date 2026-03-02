import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useFonts } from "expo-font";
import {
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from "@expo-google-fonts/orbitron";
import { soundManager } from "@/lib/sounds";
import { SettingsProvider } from "@/lib/SettingsContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Normalde burada Drizzle / Postgres init yapılacaktı, ama 
        // son kararla Offline moda geçtiğimiz için sesleri ve yerel 
        // AsyncStorage okumalarını önceden yüklüyoruz.
        await soundManager.init();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    return () => {
      soundManager.release();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appIsReady]);

  if (!fontsLoaded || !appIsReady) return null;

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
