import { Tabs } from "expo-router";
import { Text } from "react-native";

import { TabIcon, type TabIconName } from "@/components/TabIcon";
import { colors } from "@/components/ui";

const icon =
  (name: TabIconName) =>
  ({ focused, size }: { focused: boolean; size: number }) => <TabIcon name={name} focused={focused} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarLabel: ({ focused, color, children }) => (
          <Text style={{ color, fontSize: 12, fontWeight: focused ? "600" : "400" }}>{children}</Text>
        ),
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("menu") }} />
      <Tabs.Screen name="shop" options={{ title: "Shopping", tabBarIcon: icon("cart") }} />
      <Tabs.Screen name="stock" options={{ title: "Pantry", tabBarIcon: icon("pantry") }} />
      <Tabs.Screen name="recipes" options={{ title: "Recipes", tabBarIcon: icon("recipe") }} />
    </Tabs>
  );
}
