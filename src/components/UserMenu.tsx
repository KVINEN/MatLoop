import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, colors } from "@/components/ui";

type Section = "profile" | "settings" | "household";

const SECTIONS: { key: Section; label: string; text: string }[] = [
  {
    key: "profile",
    label: "Profile",
    text: "Profiles are planned. MatLoop currently stores data only on this device.",
  },
  {
    key: "settings",
    label: "Settings",
    text: "Settings are planned. There are no configurable preferences yet.",
  },
  {
    key: "household",
    label: "Household",
    text: "Households are planned: add family or household members so everyone can see the weekly menu and shopping list. Sharing is not available yet.",
  },
];

const isWeb = Platform.OS === "web";

/** Hamburger button for the tab headers; opens a small placeholder menu (Profile, Settings, Household). */
export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section | null>(null);
  const insets = useSafeAreaInsets();
  const triggerRef = useRef<View>(null);

  const close = useCallback(() => {
    setOpen(false);
    setSection(null);
    if (isWeb) setTimeout(() => (triggerRef.current as unknown as HTMLElement | null)?.focus?.(), 0);
  }, []);

  // Web only: Escape closes, Tab stays inside the panel, focus moves into the panel on open and on view change.
  useEffect(() => {
    if (!open || !isWeb) return;
    const focusFirst = setTimeout(
      () => document.querySelector<HTMLElement>('[data-testid="user-menu-panel"] [role="button"]')?.focus(),
      0,
    );
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = document.querySelector<HTMLElement>('[data-testid="user-menu-panel"]');
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>('[role="button"]:not([aria-disabled="true"])'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(focusFirst);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, section, close]);

  const current = SECTIONS.find((s) => s.key === section);

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel="Open user menu"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <View style={styles.bars} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <View style={styles.bar} />
          <View style={styles.bar} />
          <View style={styles.bar} />
        </View>
      </Pressable>
      <Modal transparent visible={open} animationType="none" onRequestClose={close} supportedOrientations={["portrait", "landscape"]}>
        <View style={styles.root} accessibilityViewIsModal>
          <Pressable
            style={styles.scrim}
            onPress={close}
            accessible={false}
            importantForAccessibility="no"
            tabIndex={-1}
          />
          <View
            testID="user-menu-panel"
            style={[styles.panel, { marginTop: insets.top + 8, marginRight: Math.max(insets.right, 0) + 8 }]}
          >
            {current ? (
              <>
                <Text accessibilityRole="header" style={styles.heading}>
                  {current.label}
                </Text>
                <Text style={styles.body}>{current.text}</Text>
                <Button label="Back to menu" variant="plain" onPress={() => setSection(null)} />
                <Button label="Close" variant="plain" onPress={close} />
              </>
            ) : (
              <>
                {SECTIONS.map((s) => (
                  <Pressable
                    key={s.key}
                    accessibilityRole="button"
                    accessibilityLabel={s.label}
                    onPress={() => setSection(s.key)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <Text style={styles.rowLabel}>{s.label}</Text>
                  </Pressable>
                ))}
                <Button label="Close" variant="plain" onPress={close} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", marginRight: 4 },
  pressed: { opacity: 0.6 },
  bars: { width: 22, gap: 4 },
  bar: { height: 2, borderRadius: 1, backgroundColor: colors.text },
  root: { flex: 1, alignItems: "flex-end" },
  scrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(32, 43, 36, 0.35)" },
  panel: {
    width: 280,
    maxWidth: "92%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 8,
  },
  row: { minHeight: 44, borderRadius: 8, paddingHorizontal: 12, justifyContent: "center" },
  rowPressed: { backgroundColor: colors.activeSoft },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: "500" },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700", paddingHorizontal: 12, paddingTop: 8 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22, paddingHorizontal: 12, paddingVertical: 8 },
});
