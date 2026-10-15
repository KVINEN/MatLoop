import { useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useHeaderHeight } from "expo-router/react-navigation";

import { Button, colors, EmptyState, SaveErrorBanner } from "@/components/ui";
import { searchRecipes } from "@/domain/recipes";
import { useShoppingStore } from "@/store/useShoppingStore";

/** "newest" is the recipe just saved: the store assigns its id, and new recipes are appended last. */
type Mode ={ kind: "list" } | { kind: "form" } | { kind: "detail"; id: string } | { kind: "newest" };

function RecipeForm({ onCancel, onSave }: { onCancel: () => void; onSave: (input: { title: string; ingredients: string; steps: string }) => boolean }) {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const saved = useRef(false);

  const save = () => {
    if (saved.current) return;
    if (!onSave({ title, ingredients, steps })) {
      setShowErrors(true);
      return;
    }
    saved.current = true;
  };

  const error = (value: string, message: string) =>
    showErrors && value.trim() === "" ? (
      <Text style={styles.error} accessibilityRole="alert">
        {message}
      </Text>
    ) : null;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        New recipe
      </Text>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} accessibilityLabel="Title" placeholder="Recipe title" placeholderTextColor={colors.muted} />
      {error(title, "Enter a title.")}
      <Text style={styles.label}>Ingredients</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={ingredients}
        onChangeText={setIngredients}
        accessibilityLabel="Ingredients"
        placeholder="One per line"
        placeholderTextColor={colors.muted}
        multiline
        textAlignVertical="top"
      />
      {error(ingredients, "Enter the ingredients.")}
      <Text style={styles.label}>Steps</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={steps}
        onChangeText={setSteps}
        accessibilityLabel="Steps"
        placeholder="One per line"
        placeholderTextColor={colors.muted}
        multiline
        textAlignVertical="top"
      />
      {error(steps, "Enter the steps.")}
      <Button label="Save recipe" onPress={save} />
      <Button label="Cancel" variant="plain" onPress={onCancel} />
    </ScrollView>
  );
}

export default function RecipesScreen() {
  const headerHeight = useHeaderHeight();
  const { data, addRecipe } = useShoppingStore();
  const [view, setView] = useState<Mode>({ kind: "list" });
  const [query, setQuery] = useState("");

  const back = () => setView({ kind: "list" });

  let body;
  if (view.kind === "form") {
    body = (
      <RecipeForm
        onCancel={back}
        onSave={(input) => {
          const ok = addRecipe(input);
          if (ok) setView({ kind: "newest" });
          return ok;
        }}
      />
    );
  } else if (view.kind === "detail" || view.kind === "newest") {
    const recipe = view.kind === "newest" ? data.recipes[data.recipes.length - 1] : data.recipes.find((r) => r.id === view.id);
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Back" variant="plain" onPress={back} accessibilityLabel="Back to recipes" />
        {recipe === undefined ? (
          <EmptyState text="This recipe is no longer available." />
        ) : (
          <>
            <Text style={styles.title} accessibilityRole="header">
              {recipe.title}
            </Text>
            <Text style={styles.label}>Ingredients</Text>
            <Text style={styles.text}>{recipe.ingredients}</Text>
            <Text style={styles.label}>Steps</Text>
            <Text style={styles.text}>{recipe.steps}</Text>
          </>
        )}
      </ScrollView>
    );
  } else {
    const results = searchRecipes(data.recipes, query);
    body = (
      <>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search recipes"
            placeholder="Search recipes"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
          />
          {query !== "" && (
            <Button label="Clear" variant="plain" onPress={() => setQuery("")} accessibilityLabel="Clear search" />
          )}
        </View>
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState text={data.recipes.length === 0 ? "No recipes yet. Create your first one." : `No recipes match "${query.trim()}".`} />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}
              onPress={() => setView({ kind: "detail", id: item.id })}
              style={styles.row}
            >
              <Text style={styles.rowTitle}>{item.title}</Text>
            </Pressable>
          )}
        />
        <View style={styles.footer}>
          <Button label="New recipe" onPress={() => setView({ kind: "form" })} />
        </View>
      </>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <SaveErrorBanner />
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 8 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  label: { fontSize: 14, fontWeight: "600", color: colors.muted, marginTop: 8 },
  text: { fontSize: 16, lineHeight: 24, color: colors.text },
  input: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  multiline: { minHeight: 120, paddingTop: 10 },
  error: { color: colors.danger },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 8, gap: 8, flexGrow: 1 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  rowTitle: { fontSize: 16, color: colors.text },
  footer: { padding: 16, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
