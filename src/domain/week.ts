const WEEK_MS = 7 * 86_400_000;

/** Local calendar arithmetic: building from y/m/d keeps results at local midnight across DST. */
export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

export function startOfDay(d: Date): Date {
  return addDays(d, 0);
}

/** Monday of the ISO week containing `d`, at local midnight. */
export function mondayOf(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7));
}

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO 8601 week number and week-year: the week belongs to the year of its Thursday. */
export function isoWeek(d: Date): { week: number; year: number } {
  const thursday = addDays(mondayOf(d), 3);
  const year = thursday.getFullYear();
  const firstThursday = addDays(mondayOf(new Date(year, 0, 4)), 3);
  // Rounding absorbs the ±1h of a DST transition between the two dates.
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / WEEK_MS);
  return { week, year };
}

/** The seven local dates (Monday..Sunday) of the week containing `d`. */
export function weekDays(d: Date): Date[] {
  const monday = mondayOf(d);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function msUntilNextDay(now: Date): number {
  return addDays(now, 1).getTime() - now.getTime();
}
