import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createPersistence, parse, serialize, STORAGE_KEY, type KeyValueStorage, type SaveState } from "./persist.ts";
import { seedRecipes } from "./recipes.ts";
import { emptyData, type AppData } from "./types.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withItem = (name: string): AppData => ({ ...emptyData, shopping: [{ id: name, name, bought: false }] });

function fakeStorage(initial: string | null, opts: { readDelay?: number; writeDelay?: () => number; failWrites?: () => boolean } = {}) {
  const store = new Map<string, string>();
  if (initial !== null) store.set(STORAGE_KEY, initial);
  const storage: KeyValueStorage = {
    async getItem(key) {
      await sleep(opts.readDelay ?? 0);
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      await sleep(opts.writeDelay?.() ?? 0);
      if (opts.failWrites?.()) throw new Error("disk full");
      store.set(key, value);
    },
  };
  return { storage, store };
}

test("saves before a slow load finishes never overwrite stored data", async () => {
  const saved = serialize(withItem("Milk"));
  const { storage, store } = fakeStorage(saved, { readDelay: 30 });
  const p = createPersistence(storage, () => {});
  const loading = p.load();
  p.save(emptyData);
  assert.deepEqual(await loading, withItem("Milk"));
  await sleep(10);
  assert.equal(store.get(STORAGE_KEY), saved);
});

test("rapid saves end with the newest snapshot even when writes finish out of order", async () => {
  const delays = [30, 1, 1, 1];
  const { storage, store } = fakeStorage(null, { writeDelay: () => delays.shift() ?? 1 });
  const p = createPersistence(storage, () => {});
  await p.load();
  for (const name of ["a", "b", "c", "d"]) p.save(withItem(name));
  await sleep(60);
  assert.deepEqual(parse(store.get(STORAGE_KEY) ?? null), withItem("d"));
});

test("a failed write reports an error and a retry saves the current state", async () => {
  let fail = true;
  const states: SaveState[] = [];
  const { storage, store } = fakeStorage(null, { failWrites: () => fail });
  const p = createPersistence(storage, (s) => states.push(s));
  await p.load();
  p.save(withItem("Milk"));
  await sleep(5);
  assert.equal(states.at(-1)?.kind, "error");
  assert.equal(store.get(STORAGE_KEY), undefined);
  fail = false;
  p.save(withItem("Milk"));
  await sleep(5);
  assert.equal(states.at(-1)?.kind, "saved");
  assert.deepEqual(parse(store.get(STORAGE_KEY) ?? null), withItem("Milk"));
});

test("unreadable data is rejected, not replaced", async () => {
  assert.throws(() => parse("{not json"));
  assert.throws(() => parse(JSON.stringify({ version: 99 })));
  const { storage, store } = fakeStorage("{not json");
  const p = createPersistence(storage, () => {});
  await assert.rejects(p.load());
  p.save(emptyData);
  await sleep(5);
  assert.equal(store.get(STORAGE_KEY), "{not json");
});

test("malformed v1 documents are rejected and the raw document is kept", async () => {
  const valid = { version: 1, menus: { "2026-10-05": ["Taco", "", "", "", "", "", ""] }, shopping: [{ id: "1", name: "Milk", bought: false }], pantry: [{ id: "2", name: "Bread" }] };
  assert.deepEqual(parse(JSON.stringify(valid)), { menus: valid.menus, shopping: valid.shopping, pantry: valid.pantry, recipes: seedRecipes });
  const malformed: Record<string, unknown> = {
    "null menus": { ...valid, menus: null },
    "array menus": { ...valid, menus: [] },
    "short week": { ...valid, menus: { "2026-10-05": ["Taco"] } },
    "non-string dinner": { ...valid, menus: { "2026-10-05": [1, "", "", "", "", "", ""] } },
    "bad menu key": { ...valid, menus: { monday: Array(7).fill("") } },
    "null row": { ...valid, shopping: [null] },
    "string bought": { ...valid, shopping: [{ id: "1", name: "Milk", bought: "false" }] },
    "missing bought": { ...valid, shopping: [{ id: "1", name: "Milk" }] },
    "blank name": { ...valid, pantry: [{ id: "2", name: "  " }] },
    "numeric id": { ...valid, pantry: [{ id: 2, name: "Bread" }] },
    "duplicate shopping ids": { ...valid, shopping: [{ id: "1", name: "Milk", bought: false }, { id: "1", name: "Eggs", bought: true }] },
    "id in both lists": { ...valid, pantry: [{ id: "1", name: "Milk" }] },
  };
  for (const [label, doc] of Object.entries(malformed)) {
    const raw = JSON.stringify(doc);
    assert.throws(() => parse(raw), /Unrecognised saved data/, label);
    const { storage, store } = fakeStorage(raw);
    const p = createPersistence(storage, () => {});
    await assert.rejects(p.load(), label);
    p.save(emptyData);
    await sleep(1);
    assert.equal(store.get(STORAGE_KEY), raw, label);
  }
});
