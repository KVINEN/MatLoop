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

/** Parses the stored document. Throws on anything unrecognised so callers never replace it with empty data. */
export function parse(raw: string | null): AppData {
  if (raw === null) return emptyData;
  const doc = JSON.parse(raw);
  if (doc?.version !== VERSION || !Array.isArray(doc.shopping) || !Array.isArray(doc.pantry) || typeof doc.menus !== "object") {
    throw new Error(`Unrecognised saved data (version ${String(doc?.version)})`);
  }
  return { menus: doc.menus, shopping: doc.shopping, pantry: doc.pantry };
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
