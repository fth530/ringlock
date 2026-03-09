import React from "react";
import { View, StyleSheet } from "react-native";
import { SCREEN_W, SCREEN_H } from "@/constants/game";

export function GridBackground() {
    const lines: React.ReactNode[] = [];
    const step = 52;
    for (let x = 0; x <= SCREEN_W; x += step)
        lines.push(
            <View
                key={`v${x}`}
                style={[s.gridLine, { left: x, width: 1, height: SCREEN_H }]}
            />
        );
    for (let y = 0; y <= SCREEN_H; y += step)
        lines.push(
            <View
                key={`h${y}`}
                style={[s.gridLine, { top: y, height: 1, width: SCREEN_W }]}
            />
        );
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {lines}
        </View>
    );
}

const s = StyleSheet.create({
    gridLine: {
        position: "absolute",
        backgroundColor: "rgba(0,255,232,0.035)",
    },
});
