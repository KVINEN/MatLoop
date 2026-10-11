import type { AppData, WeekMenu } from "./types.ts";

export type Action =
  | { type: "setDinner"; weekKey: string; day: number; text: string }
  | { type: "addItem"; id: string; name: string }
  | { type: "removeItem"; id: string }
  | { type: "toggleItem"; id: string }
  | { type: "finishShopping" }
  | { type: "removePantry"; id: string };

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
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
