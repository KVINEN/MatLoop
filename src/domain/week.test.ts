import { strict as assert } from "node:assert";
import { test } from "node:test";
import { dateKey, isoWeek, mondayOf, msUntilNextDay, weekDays } from "./week.ts";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

test("ISO year boundaries", () => {
  assert.deepEqual(isoWeek(day(2027, 1, 1)), { week: 53, year: 2026 });
  assert.deepEqual(isoWeek(day(2027, 1, 3)), { week: 53, year: 2026 });
  assert.deepEqual(isoWeek(day(2027, 1, 4)), { week: 1, year: 2027 });
  assert.deepEqual(isoWeek(day(2024, 12, 30)), { week: 1, year: 2025 });
  assert.deepEqual(isoWeek(day(2026, 10, 9)), { week: 41, year: 2026 });
});

test("weeks spanning DST changes keep whole-day boundaries", () => {
  // Europe: summer time ends 2026-10-25, starts 2027-03-28.
  assert.deepEqual(isoWeek(day(2026, 10, 26)), { week: 44, year: 2026 });
  assert.deepEqual(isoWeek(day(2027, 3, 29)), { week: 13, year: 2027 });
  assert.deepEqual(weekDays(day(2026, 10, 25)).map(dateKey), [
    "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25",
  ]);
});

test("Sunday to Monday rollover starts a new week", () => {
  const sunday = new Date(2026, 9, 11, 23, 59);
  const monday = new Date(2026, 9, 12, 0, 0);
  assert.equal(dateKey(mondayOf(sunday)), "2026-10-05");
  assert.equal(dateKey(mondayOf(monday)), "2026-10-12");
  assert.equal(isoWeek(sunday).week + 1, isoWeek(monday).week);
  assert.equal(msUntilNextDay(sunday), 60_000);
});
