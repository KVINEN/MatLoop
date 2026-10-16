import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { colors } from "@/components/ui";

const sources = {
  menu: require("../../assets/images/tabIcons/menu.svg"),
  cart: require("../../assets/images/tabIcons/cart.svg"),
  pantry: require("../../assets/images/tabIcons/pantry.svg"),
  recipe: require("../../assets/images/tabIcons/recipe.svg"),
};

export type TabIconName = keyof typeof sources;

/** Decorative outline icon; the parent tab supplies the accessible label and selected state. */
export function TabIcon({ name, focused, size }: { name: TabIconName; focused: boolean; size: number }) {
  return (
    <View style={[styles.circle, focused && styles.active]} accessible={false}>
      <Image
        source={sources[name]}
        contentFit="contain"
        style={{ width: Math.min(size, 26), height: Math.min(size, 26) }}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  active: { backgroundColor: colors.activeSoft },
});
