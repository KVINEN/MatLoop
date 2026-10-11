import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useHeaderHeight } from "expo-router/react-navigation";

import { Button, colors, SaveErrorBanner } from "@/components/ui";
import { dateKey, isoWeek, weekDays } from "@/domain/week";
import { useToday } from "@/hooks/useToday";
import { useShoppingStore } from "@/store/useShoppingStore";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

function DinnerRow({ label, value, onSave }: { label: string; value: string; onSave: (text: string) => void }) {
  const [draft, setDraft] = useState(value);
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
          />
        ))}
        <Button label="Go shopping" onPress={() => router.navigate("/shop")} />
      </ScrollView>
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
});
