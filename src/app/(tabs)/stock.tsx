import { FlatList, StyleSheet, Text, View } from "react-native";

import { Button, colors, EmptyState, SaveErrorBanner } from "@/components/ui";
import { useShoppingStore } from "@/store/useShoppingStore";

export default function PantryScreen() {
  const { data, removePantry } = useShoppingStore();

  return (
    <View style={styles.flex}>
      <SaveErrorBanner />
      <FlatList
        contentContainerStyle={styles.list}
        data={data.pantry}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Button
              label="Remove"
              variant="plain"
              onPress={() => removePantry(item.id)}
              accessibilityLabel={`Remove ${item.name} from pantry`}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState text="Your pantry is empty. Tick off items on the Shopping tab and tap Finish shopping to move them here." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
  },
  name: { flex: 1, fontSize: 16, color: colors.text },
});
