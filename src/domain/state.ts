import type { AppData, Recipe, WeekMenu } from "./types.ts";

export type Action =
  | { type: "setDinner"; weekKey: string; day: number; text: string }
  | { type: "addItem"; id: string; name: string }
  | { type: "removeItem"; id: string }
  | { type: "toggleItem"; id: string }
  | { type: "finishShopping" }
  | { type: "removePantry"; id: string }
  | { type: "addRecipe"; id: string; title: string; ingredients: string; steps: string };

/** Trimmed item name, or null if nothing is left. */
export function normalizeName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed === "" ? null : trimmed;
}

/** Moves bought rows to the pantry in one step. Entries keep the row's id, so a row can never be transferred twice. */
export function finishShopping(data: AppData): { data: AppData; moved: number } {
  const bought = data.shopping.filter((item) => item.bought);
  if (bought.length === 0) return { data, moved: 0 };
  return {
    data: {
      ...data,
      shopping: data.shopping.filter((item) => !item.bought),
      pantry: [...data.pantry, ...bought.map(({ id, name }) => ({ id, name }))],
    },
    moved: bought.length,
  };
}

/** Trimmed recipe fields (internal line breaks kept), or null if any field is blank. */
export function normalizeRecipe(input: { title: string; ingredients: string; steps: string }): Omit<Recipe, "id"> | null {
  const title = normalizeName(input.title);
  const ingredients = normalizeName(input.ingredients);
  const steps = normalizeName(input.steps);
  return title === null || ingredients === null || steps === null ? null : { title, ingredients, steps };
}

export function reduce(data: AppData, action: Action): AppData {
  switch (action.type) {
    case "setDinner": {
      const week: WeekMenu = [...(data.menus[action.weekKey] ?? Array<string>(7).fill(""))];
      week[action.day] = action.text.trim();
      return { ...data, menus: { ...data.menus, [action.weekKey]: week } };
    }
    case "addItem": {
      const name = normalizeName(action.name);
      if (name === null) return data;
      return { ...data, shopping: [...data.shopping, { id: action.id, name, bought: false }] };
    }
    case "removeItem":
      return { ...data, shopping: data.shopping.filter((item) => item.id !== action.id) };
    case "toggleItem":
      return {
        ...data,
        shopping: data.shopping.map((item) =>
          item.id === action.id ? { ...item, bought: !item.bought } : item,
        ),
      };
    case "finishShopping":
      return finishShopping(data).data;
    case "removePantry":
      return { ...data, pantry: data.pantry.filter((entry) => entry.id !== action.id) };
    case "addRecipe": {
      const recipe = normalizeRecipe(action);
      if (recipe === null) return data;
      return { ...data, recipes: [...data.recipes, { id: action.id, ...recipe }] };
    }
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
