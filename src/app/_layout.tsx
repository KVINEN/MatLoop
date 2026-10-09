import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button, colors } from "@/components/ui";
import { ShoppingStoreProvider, useShoppingStore } from "@/store/useShoppingStore";

/** Nothing is editable until saved data has loaded, so an empty initial state can never be saved over it. */
function HydrationGate() {
  const { hydration, retryLoad } = useShoppingStore();

  if (hydration.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading your plan…</Text>
      </View>
    );
  }
  if (hydration.status === "error") {
    return (
      <View style={styles.center} accessibilityRole="alert">
        <Text style={styles.title}>Couldn't read your saved data</Text>
        <Text style={styles.text}>Nothing has been erased. Try again, or restart the app.</Text>
        <Button label="Try again" onPress={retryLoad} />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ShoppingStoreProvider>
      <StatusBar style="dark" />
      <HydrationGate />
    </ShoppingStoreProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: "600", color: colors.text, textAlign: "center" },
  text: { fontSize: 15, color: colors.muted, textAlign: "center" },
});
