export type ShoppingItem = { id: string; name: string; bought: boolean };

export type PantryEntry = { id: string; name: string };

/** Dinners for one week, Monday..Sunday. An empty string means nothing planned. */
export type WeekMenu = string[];

export type AppData = {
  /** Keyed by the local date (YYYY-MM-DD) of the week's Monday. */
  menus: Record<string, WeekMenu>;
  shopping: ShoppingItem[];
  pantry: PantryEntry[];
};

export const emptyData: AppData = { menus: {}, shopping: [], pantry: [] };
