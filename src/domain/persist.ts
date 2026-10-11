import { emptyData, type AppData } from "./types.ts";

export const STORAGE_KEY = "matloop:data";
const VERSION = 1;

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

export function serialize(data: AppData): string {
  return JSON.stringify({ version: VERSION, ...data });
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isName = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Returns why the document isn't valid v1 data, or null if it is. */
function invalidReason(doc: unknown): string | null {
  if (!isRecord(doc)) return "not an object";
  if (doc.version !== VERSION) return `version ${String(doc.version)}`;
  if (!isRecord(doc.menus)) return "menus is not an object";
  for (const [key, week] of Object.entries(doc.menus)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return `menu key ${key}`;
    if (!Array.isArray(week) || week.length !== 7 || !week.every((d) => typeof d === "string")) return `menu ${key}`;
  }
  if (!Array.isArray(doc.shopping) || !Array.isArray(doc.pantry)) return "shopping or pantry is not a list";
  // Pantry entries keep their shopping row's id, so ids are unique across both lists.
  const ids = new Set<unknown>();
  for (const row of [...doc.shopping, ...doc.pantry]) {
    if (!isRecord(row) || typeof row.id !== "string" || row.id === "" || !isName(row.name)) return "invalid item";
    if (ids.has(row.id)) return `duplicate id ${row.id}`;
    ids.add(row.id);
  }
  if (!doc.shopping.every((row) => typeof row.bought === "boolean")) return "invalid bought flag";
  return null;
}

/** Parses the stored document. Throws on anything unrecognised so callers never replace it with empty data. */
export function parse(raw: string | null): AppData {
  if (raw === null) return emptyData;
  const doc = JSON.parse(raw);
  const reason = invalidReason(doc);
  if (reason !== null) throw new Error(`Unrecognised saved data (${reason})`);
  const { menus, shopping, pantry } = doc as AppData;
  return {
    menus,
    shopping: shopping.map(({ id, name, bought }) => ({ id, name, bought })),
    pantry: pantry.map(({ id, name }) => ({ id, name })),
  };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Loads once, then saves whole-document snapshots one at a time. While a write is in flight only the newest
 * pending snapshot is kept, so an older snapshot can never land after a newer one. Saves before a successful
 * load are ignored, so an empty initial state can't overwrite stored data.
 */
export function createPersistence(storage: KeyValueStorage, onSaveState: (state: SaveState) => void) {
  let loaded = false;
  let writing = false;
  let pending: AppData | null = null;

  async function flush() {
    writing = true;
    while (pending !== null) {
      const snapshot = pending;
      pending = null;
      onSaveState({ kind: "saving" });
      try {
        await storage.setItem(STORAGE_KEY, serialize(snapshot));
      } catch (error) {
        writing = false;
        onSaveState({ kind: "error", message: message(error) });
        return;
      }
    }
    writing = false;
    onSaveState({ kind: "saved" });
  }

  return {
    async load(): Promise<AppData> {
      const data = parse(await storage.getItem(STORAGE_KEY));
      loaded = true;
      return data;
    },
    save(data: AppData): void {
      if (!loaded) return;
      pending = data;
      if (!writing) void flush();
    },
  };
}
