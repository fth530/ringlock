import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link, Stack } from "expo-router";
import { C } from "@/constants/game";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <View style={s.container}>
        <Text style={s.title}>404</Text>
        <Text style={s.subtitle}>LOST IN SPACE</Text>
        <View style={s.separator} />
        <Text style={s.message}>This page doesn't exist.</Text>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.btnText}>GO HOME</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    padding: 24,
  },
  title: {
    fontFamily: "Orbitron_900Black",
    fontSize: 72,
    color: C.pink,
    letterSpacing: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 14,
    letterSpacing: 6,
    color: C.subtleText,
    marginBottom: 24,
  },
  separator: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(0,255,232,0.22)",
    marginBottom: 24,
  },
  message: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 12,
    color: C.subtleText,
    marginBottom: 32,
  },
  btn: {
    borderWidth: 1,
    borderColor: C.cyan,
    borderRadius: 3,
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  btnText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 13,
    letterSpacing: 4,
    color: C.cyan,
  },
});
