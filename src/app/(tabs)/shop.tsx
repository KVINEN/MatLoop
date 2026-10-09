import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, colors, EmptyState, SaveErrorBanner } from "@/components/ui";
import type { ShoppingItem } from "@/domain/types";
import { useShoppingStore } from "@/store/useShoppingStore";

function ItemRow({ item, onToggle, onRemove }: { item: ShoppingItem; onToggle: () => void; onRemove: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.check}
        onPress={onToggle}
        role="checkbox"
        aria-checked={item.bought}
        aria-label={`${item.name}, bought`}
        hitSlop={4}
      >
        <View style={[styles.box, item.bought && styles.boxChecked]}>
          {item.bought && <Text style={styles.tick}>✓</Text>}
        </View>
        <Text style={[styles.name, item.bought && styles.bought]}>{item.name}</Text>
      </Pressable>
      <Button label="Remove" variant="plain" onPress={onRemove} accessibilityLabel={`Remove ${item.name} from shopping list`} />
    </View>
  );
}

export default function ShoppingScreen() {
  const { data, lastMoved, addItem, toggleItem, removeItem, finishShopping } = useShoppingStore();
  const [name, setName] = useState("");
  const [invalid, setInvalid] = useState(false);
  const anyBought = data.shopping.some((item) => item.bought);

  const add = () => {
    if (addItem(name)) {
      setName("");
      setInvalid(false);
    } else {
      setInvalid(true);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <SaveErrorBanner />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setInvalid(false);
          }}
          onSubmitEditing={add}
          submitBehavior="submit"
          placeholder="Add an item"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          accessibilityLabel="New item name"
        />
        <Button label="Add" onPress={add} disabled={name.trim() === ""} accessibilityLabel="Add item to shopping list" />
      </View>
      {invalid && <Text style={styles.error}>Enter an item name.</Text>}
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.list}
        data={data.shopping}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ItemRow item={item} onToggle={() => toggleItem(item.id)} onRemove={() => removeItem(item.id)} />
        )}
        ListEmptyComponent={<EmptyState text="Your shopping list is empty. Add what you need above, then tick items off as you shop." />}
      />
      <View style={styles.footer}>
        {lastMoved !== null && (
          <Text style={styles.success} accessibilityLiveRegion="polite">
            Moved {lastMoved} {lastMoved === 1 ? "item" : "items"} to Pantry.
          </Text>
        )}
        <Button label="Finish shopping" onPress={finishShopping} disabled={!anyBought} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addRow: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  error: { color: colors.danger, paddingHorizontal: 16 },
  list: { padding: 16, paddingTop: 8, gap: 8, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
  },
  check: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  boxChecked: { backgroundColor: colors.primary },
  tick: { color: "#FFFFFF", fontWeight: "700" },
  name: { flex: 1, fontSize: 16, color: colors.text },
  bought: { textDecorationLine: "line-through", color: colors.muted },
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  success: { color: colors.primary, backgroundColor: colors.successSoft, padding: 8, borderRadius: 8, textAlign: "center" },
});
