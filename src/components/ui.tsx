import { Pressable, StyleSheet, Text, View } from "react-native";

import { useShoppingStore } from "@/store/useShoppingStore";

export const colors = {
  background: "#F7F7EF",
  surface: "#FFFFFF",
  text: "#202B24",
  muted: "#536257",
  border: "#839083",
  primary: "#285A3F",
  onPrimary: "#FFFFFF",
  activeSoft: "#DCEBCB",
  danger: "#A52D25",
  dangerSoft: "#FCEDE9",
  successSoft: "#EDF4E5",
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "plain";
  accessibilityLabel?: string;
};

export function Button({ label, onPress, disabled, variant = "primary", accessibilityLabel }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" ? styles.primary : styles.plain,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={variant === "primary" ? styles.primaryLabel : styles.plainLabel}>{label}</Text>
    </Pressable>
  );
}

/** Shown when the latest change could not be saved; the change stays on screen until a retry succeeds. */
export function SaveErrorBanner() {
  const { saveState, retrySave } = useShoppingStore();
  if (saveState.kind !== "error") return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.bannerText}>Couldn't save your latest changes. They're still here on screen.</Text>
      <Button label="Retry" variant="plain" onPress={retrySave} accessibilityLabel="Retry saving" />
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

const styles = StyleSheet.create({
  button: { minHeight: 44, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.primary },
  plain: { backgroundColor: "transparent" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
  primaryLabel: { color: colors.onPrimary, fontSize: 16, fontWeight: "600" },
  plainLabel: { color: colors.primary, fontSize: 16, fontWeight: "600" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: colors.dangerSoft,
    borderBottomWidth: 1,
    borderColor: colors.danger,
  },
  bannerText: { flex: 1, color: colors.danger, fontSize: 14 },
  empty: { color: colors.muted, fontSize: 15, textAlign: "center", padding: 32, lineHeight: 22 },
});
