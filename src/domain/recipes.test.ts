import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createPersistence, parse, serialize, STORAGE_KEY, type KeyValueStorage } from "./persist.ts";
import { searchRecipes, seedRecipes } from "./recipes.ts";
import { reduce } from "./state.ts";
import { emptyData } from "./types.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function memoryStorage(initial: string | null) {
  const store = new Map<string, string>();
  if (initial !== null) store.set(STORAGE_KEY, initial);
  const storage: KeyValueStorage = {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => void store.set(key, value),
  };
  return { storage, store };
}

const v1 = { version: 1, menus: { "2026-10-05": ["Taco", "", "", "", "", "", ""] }, shopping: [{ id: "1", name: "Milk", bought: false }], pantry: [{ id: "2", name: "Bread" }] };

test("seed recipes are three deterministic multiline demo recipes", () => {
  assert.equal(seedRecipes.length, 3);
  assert.deepEqual(seedRecipes.map((r) => r.title), ["Tomato pasta", "Vegetable soup", "Bean tacos"]);
  for (const r of seedRecipes) {
    assert.ok(r.id.startsWith("demo-recipe-"));
    assert.ok(r.ingredients.includes("\n") && r.steps.includes("\n"));
  }
  assert.equal(new Set(seedRecipes.map((r) => r.id)).size, 3);
});

test("raw v1 upgrades with exactly three seeds, serializes as v2 and reloads without reseeding", async () => {
  const { storage, store } = memoryStorage(JSON.stringify(v1));
  const p = createPersistence(storage, () => {});
  const loaded = await p.load();
  assert.deepEqual(loaded.menus, v1.menus);
  assert.deepEqual(loaded.shopping, v1.shopping);
  assert.deepEqual(loaded.pantry, v1.pantry);
  assert.deepEqual(loaded.recipes, seedRecipes);
  p.save(reduce(loaded, { type: "addRecipe", id: "r1", title: "Mine", ingredients: "a", steps: "b" }));
  await sleep(5);
  const raw = store.get(STORAGE_KEY) ?? "";
  assert.equal(JSON.parse(raw).version, 2);
  assert.equal(parse(raw).recipes.length, 4);
});

test("fresh install gets seeds; an empty v2 recipe list stays empty", () => {
  assert.deepEqual(parse(null).recipes, seedRecipes);
  const emptied = serialize({ ...parse(null), recipes: [] });
  assert.deepEqual(parse(emptied).recipes, []);
  assert.deepEqual(parse(serialize(emptyData)), emptyData);
});

test("recipes are trimmed, keep line breaks, reject blanks and allow duplicate titles", () => {
  const data = [
    { type: "addRecipe", id: "a", title: "  Pancakes ", ingredients: "\n Flour\nMilk \n", steps: " Mix.\n\nFry. " },
    { type: "addRecipe", id: "b", title: "Pancakes", ingredients: "x", steps: "y" },
    { type: "addRecipe", id: "c", title: "   ", ingredients: "x", steps: "y" },
    { type: "addRecipe", id: "d", title: "T", ingredients: "", steps: "y" },
    { type: "addRecipe", id: "e", title: "T", ingredients: "x", steps: " \n " },
  ] as const;
  const result = data.reduce(reduce, emptyData);
  assert.deepEqual(result.recipes, [
    { id: "a", title: "Pancakes", ingredients: "Flour\nMilk", steps: "Mix.\n\nFry." },
    { id: "b", title: "Pancakes", ingredients: "x", steps: "y" },
  ]);
  assert.deepEqual(parse(serialize(result)), result);
});

test("malformed recipes and unknown versions are rejected and the raw document is kept", async () => {
  const ok = { id: "r", title: "T", ingredients: "i", steps: "s" };
  const v2 = { ...v1, version: 2, recipes: [ok] };
  assert.deepEqual(parse(JSON.stringify(v2)).recipes, [ok]);
  const bad: Record<string, unknown> = {
    "missing recipes": { ...v2, recipes: undefined },
    "recipes object": { ...v2, recipes: {} },
    "null recipe": { ...v2, recipes: [null] },
    "blank id": { ...v2, recipes: [{ ...ok, id: " " }] },
    "blank title": { ...v2, recipes: [{ ...ok, title: " " }] },
    "numeric steps": { ...v2, recipes: [{ ...ok, steps: 1 }] },
    "missing ingredients": { ...v2, recipes: [{ id: "r", title: "T", steps: "s" }] },
    "duplicate recipe ids": { ...v2, recipes: [ok, { ...ok, title: "Other" }] },
    "invalid shopping in v2": { ...v2, shopping: [null] },
    "invalid v1": { ...v1, pantry: [{ id: 2, name: "Bread" }] },
    "version 3": { ...v2, version: 3 },
    "version 0": { ...v2, version: 0 },
  };
  for (const [label, doc] of Object.entries(bad)) {
    const raw = JSON.stringify(doc);
    assert.throws(() => parse(raw), /Unrecognised saved data/, label);
    const { storage, store } = memoryStorage(raw);
    const p = createPersistence(storage, () => {});
    await assert.rejects(p.load(), label);
    p.save(emptyData);
    await sleep(1);
    assert.equal(store.get(STORAGE_KEY), raw, label);
  }
});

test("searchRecipes matches trimmed, case-insensitive title substrings in order", () => {
  assert.deepEqual(searchRecipes(seedRecipes, "  PASTA ").map((r) => r.title), ["Tomato pasta"]);
  assert.deepEqual(searchRecipes(seedRecipes, "o").map((r) => r.title), ["Tomato pasta", "Vegetable soup", "Bean tacos"]);
  assert.deepEqual(searchRecipes(seedRecipes, "nothing"), []);
  assert.equal(searchRecipes(seedRecipes, "   "), seedRecipes);
});

test("recipe ids may match shopping or pantry ids", () => {
  const doc = { ...v1, version: 2, recipes: [{ id: "1", title: "T", ingredients: "i", steps: "s" }] };
  assert.equal(parse(JSON.stringify(doc)).recipes[0].id, "1");
});
