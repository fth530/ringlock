import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { C } from "@/constants/game";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

// ─── Sub-Component: Error Details Modal ──────────────────────────────────────
function ErrorModal({
  visible,
  onClose,
  errorText,
  insets
}: {
  visible: boolean;
  onClose: () => void;
  errorText: string;
  insets: { top: number; bottom: number };
}) {
  if (!visible) return null;

  const monoFont = Platform.select({ ios: "Menlo", default: "monospace" });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>SYSTEM LOG: FAILURE</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={({ pressed }) => [s.closeButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="x" size={24} color={C.pink} />
            </Pressable>
          </View>
          <ScrollView
            style={s.modalScrollView}
            contentContainerStyle={[{ paddingBottom: insets.bottom + 16, padding: 16 }]}
          >
            <View style={s.errorDetailBox}>
              <Text style={[s.errorText, { fontFamily: monoFont }]} selectable>
                {errorText}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Error Screen ──────────────────────────────────────────────────────
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (e) {
      console.error("Failed to restart:", e);
      resetError();
    }
  };

  const errorDetails = `FATAL ERROR: ${error.message}\n\nTRACE:\n${error.stack || "N/A"}`;

  return (
    <View style={s.root}>
      {__DEV__ && (
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [s.devButton, { top: insets.top + 16, opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="terminal" size={20} color={C.cyan} />
        </Pressable>
      )}

      <View style={s.content}>
        <Feather name="alert-triangle" size={64} color={C.pink} style={s.icon} />
        <Text style={s.title}>SYSTEM FAILURE</Text>
        <Text style={s.message}>
          A critical error has occurred in the simulation.
          Reboot is required.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            s.buttonOuter,
            pressed && { opacity: 0.7 }
          ]}
        >
          <Text style={s.buttonText}>REBOOT SYSTEM</Text>
        </Pressable>
      </View>

      {__DEV__ && (
        <ErrorModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          errorText={errorDetails}
          insets={insets}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgMid,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  icon: {
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: C.pink, shadowRadius: 16, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 } }
    })
  },
  title: {
    fontFamily: "Orbitron_900Black",
    fontSize: 28,
    color: C.pink,
    letterSpacing: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontFamily: "Orbitron_400Regular",
    fontSize: 14,
    color: C.subtleText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    letterSpacing: 2,
  },
  buttonOuter: {
    borderWidth: 2,
    borderColor: C.cyan,
    borderRadius: 4,
    paddingHorizontal: 36,
    paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: C.cyan, shadowRadius: 10, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 } }
    }),
  },
  buttonText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 16,
    color: C.cyan,
    letterSpacing: 4,
  },
  devButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(0, 255, 232, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 232, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: C.overlayBg,
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "85%",
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: C.cyan,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 255, 232, 0.2)",
  },
  modalTitle: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 14,
    color: C.pink,
    letterSpacing: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: C.bgMid,
  },
  errorDetailBox: {
    backgroundColor: "rgba(255, 0, 102, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 102, 0.2)",
    borderRadius: 4,
    padding: 16,
  },
  errorText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#ff80aa",
  },
});
