import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useHeaderHeight } from "expo-router/react-navigation";

import { Button, colors, EmptyState, SaveErrorBanner } from "@/components/ui";
import { searchRecipes } from "@/domain/recipes";
import { dateKey, isoWeek, weekDays } from "@/domain/week";
import { useToday } from "@/hooks/useToday";
import { useShoppingStore } from "@/store/useShoppingStore";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

function RecipePicker({ dayLabel, onChoose, onCancel }: { dayLabel: string; onChoose: (title: string) => void; onCancel: () => void }) {
  const { data } = useShoppingStore();
  const [query, setQuery] = useState("");
  const results = searchRecipes(data.recipes, query);
  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <View style={styles.pickerScreen}>
        <Text style={styles.title} accessibilityRole="header">
          Choose recipe for {dayLabel}
        </Text>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search recipes"
          placeholder="Search recipes"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
        />
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.pickerList}
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState text={data.recipes.length === 0 ? "No recipes yet. Create one in the Recipes tab." : `No recipes match "${query.trim()}".`} />
          }
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${item.title}`} onPress={() => onChoose(item.title)} style={styles.pickerRow}>
              <Text style={styles.pickerRowTitle}>{item.title}</Text>
            </Pressable>
          )}
        />
        <Button label="Cancel" variant="plain" onPress={onCancel} accessibilityLabel="Cancel choosing recipe" />
      </View>
    </Modal>
  );
}

function DinnerRow({ label, value, onSave, onChoose }: { label: string; value: string; onSave: (text: string) => void; onChoose: () => void }) {
  const [draft, setDraft] = useState(value);
  // Follow external changes (a chosen recipe); a draft that only differs by whitespace is the user's own edit.
  useEffect(() => {
    setDraft((current) => (current.trim() === value ? current : value));
  }, [value]);
  // Save on every change: Android never blurs the input when the app is left mid-edit.
  const change = (text: string) => {
    setDraft(text);
    if (text.trim() !== value) onSave(text);
  };
  const commit = () => setDraft(draft.trim());
  return (
    <View style={styles.row}>
      <Text style={styles.day}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={change}
          onBlur={commit}
          onSubmitEditing={commit}
          placeholder="What's for dinner?"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          accessibilityLabel={`Dinner on ${label}`}
        />
        {value !== "" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear dinner on ${label}`}
            onPress={() => {
              setDraft("");
              onSave("");
            }}
            style={styles.clear}
            hitSlop={8}
          >
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>
      <Button label="Choose recipe" variant="plain" onPress={onChoose} accessibilityLabel={`Choose recipe for ${label}`} />
    </View>
  );
}

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const today = useToday();
  const { data, setDinner } = useShoppingStore();
  const days = weekDays(today);
  const weekKey = dateKey(days[0]);
  const { week, year } = isoWeek(today);
  const menu = data.menus[weekKey] ?? [];
  const [picking, setPicking] = useState<{ weekKey: string; day: number } | null>(null);
  // A picker left open across a week rollover is dropped rather than assigning to a different week.
  const activePick = picking !== null && picking.weekKey === weekKey ? picking : null;
  useEffect(() => {
    if (picking !== null && picking.weekKey !== weekKey) setPicking(null);
  }, [picking, weekKey]);

  return (
    // KeyboardAvoidingView compares its in-parent frame with the on-screen keyboard, so offset by the header above it.
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <SaveErrorBanner />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Week {week}, {year}
        </Text>
        <Text style={styles.subtitle}>
          {shortDate(days[0])} – {shortDate(days[6])}
        </Text>
        {days.map((d, i) => (
          <DinnerRow
            key={`${weekKey}-${i}`}
            label={`${DAY_NAMES[i]} ${shortDate(d)}`}
            value={menu[i] ?? ""}
            onSave={(text) => setDinner(weekKey, i, text)}
            onChoose={() => setPicking({ weekKey, day: i })}
          />
        ))}
        <Button label="Go shopping" onPress={() => router.navigate("/shop")} />
      </ScrollView>
      {activePick !== null && (
        <RecipePicker
          dayLabel={`${DAY_NAMES[activePick.day]} ${shortDate(days[activePick.day])}`}
          onCancel={() => setPicking(null)}
          onChoose={(title) => {
            setDinner(activePick.weekKey, activePick.day, title);
            setPicking(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 4 },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: colors.border },
  day: { fontSize: 14, fontWeight: "600", color: colors.muted },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 6 },
  clear: { padding: 6 },
  clearText: { fontSize: 16, color: colors.muted },
  pickerScreen: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 },
  search: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  pickerList: { gap: 8, flexGrow: 1 },
  pickerRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  pickerRowTitle: { fontSize: 16, color: colors.text },
});
