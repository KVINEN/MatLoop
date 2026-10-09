import { strict as assert } from "node:assert";
import { test } from "node:test";
import { finishShopping, reduce, type Action } from "./state.ts";
import { emptyData, type AppData } from "./types.ts";

const run = (actions: Action[], start: AppData = emptyData) => actions.reduce(reduce, start);

test("finishing moves exactly the checked rows and leaves the rest", () => {
  const data = run([
    { type: "addItem", id: "1", name: "Milk" },
    { type: "addItem", id: "2", name: "Bread" },
    { type: "addItem", id: "3", name: "Eggs" },
    { type: "toggleItem", id: "1" },
    { type: "toggleItem", id: "2" },
  ]);
  const { data: after, moved } = finishShopping(data);
  assert.equal(moved, 2);
  assert.deepEqual(after.shopping.map((i) => i.name), ["Eggs"]);
  assert.deepEqual(after.pantry, [{ id: "1", name: "Milk" }, { id: "2", name: "Bread" }]);
});

test("repeated finishes do not transfer twice", () => {
  const data = run([{ type: "addItem", id: "1", name: "Milk" }, { type: "toggleItem", id: "1" }]);
  const twice = run([{ type: "finishShopping" }, { type: "finishShopping" }], data);
  assert.equal(twice.pantry.length, 1);
  assert.equal(finishShopping(twice).moved, 0);
});

test("names are trimmed, blanks rejected, duplicates kept separately", () => {
  const data = run([
    { type: "addItem", id: "1", name: "  Milk " },
    { type: "addItem", id: "2", name: "   " },
    { type: "addItem", id: "3", name: "Milk" },
  ]);
  assert.deepEqual(data.shopping, [
    { id: "1", name: "Milk", bought: false },
    { id: "3", name: "Milk", bought: false },
  ]);
  const pantry = run([{ type: "toggleItem", id: "1" }, { type: "toggleItem", id: "3" }, { type: "finishShopping" }, { type: "removePantry", id: "1" }], data).pantry;
  assert.deepEqual(pantry, [{ id: "3", name: "Milk" }]);
});

test("dinners are stored per week and clearing keeps other weeks", () => {
  const data = run([
    { type: "setDinner", weekKey: "2026-10-05", day: 0, text: " Tacos " },
    { type: "setDinner", weekKey: "2026-10-12", day: 6, text: "Soup" },
    { type: "setDinner", weekKey: "2026-10-05", day: 0, text: "" },
  ]);
  assert.deepEqual(data.menus["2026-10-05"], ["", "", "", "", "", "", ""]);
  assert.equal(data.menus["2026-10-12"][6], "Soup");
});
