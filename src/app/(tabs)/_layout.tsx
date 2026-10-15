import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/components/ui";

const icon = (glyph: string) => () => <Text style={{ fontSize: 20 }}>{glyph}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("🏠") }} />
      <Tabs.Screen name="shop" options={{ title: "Shopping", tabBarIcon: icon("🛒") }} />
      <Tabs.Screen name="stock" options={{ title: "Pantry", tabBarIcon: icon("🧺") }} />
      <Tabs.Screen name="recipes" options={{ title: "Recipes", tabBarIcon: icon("📖") }} />
    </Tabs>
  );
}
