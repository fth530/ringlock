import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { LAYOUT } from "@/constants/game";

export const GridBackground = React.memo(function GridBackground() {
    const { width, height } = useWindowDimensions();

    const lines = useMemo(() => {
        const result: React.ReactNode[] = [];
        const step = LAYOUT.GRID_STEP;
        for (let x = 0; x <= width; x += step)
            result.push(
                <View key={`v${x}`} style={[s.gridLine, { left: x, width: 1, height }]} />
            );
        for (let y = 0; y <= height; y += step)
            result.push(
                <View key={`h${y}`} style={[s.gridLine, { top: y, height: 1, width }]} />
            );
        return result;
    }, [width, height]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {lines}
        </View>
    );
});

const s = StyleSheet.create({
    gridLine: {
        position: "absolute",
        backgroundColor: "rgba(0,255,232,0.035)",
    },
});
