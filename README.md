# MatLoop

**Core Concept**
MatLoop transforms the weekly struggle of meal planning into a seamless, automated flow. No more wondering what to cook, what ingredients are hiding in the back of the freezer, or double-buying groceries.

The app bridges the gap between your meal plan, the grocery store, and your pantry. By combining an weekly menu with an smart shopping list, MatLoop calculates exactly what you need based on your current inventory. When you check out at the store, your household stock is automatically updated, creating a perfect loop of planning, buying, and cooking.

## v1: what works today

v1 is a local, single-device version of the loop:

- **Home**: this week's dinners (ISO week, Monday–Sunday). One free-text dinner per day, saved as you type; ✕ clears it. Earlier weeks stay saved; only the current week is shown.
- **Shopping**: add named items (duplicates are fine), tick them off as you shop, then **Finish shopping** to move the ticked items to the pantry.
- **Pantry**: everything you've bought. Remove an entry when it's used, eaten or spoiled.

Recipes, automatic shopping lists, quantities, accounts and sync are not in v1.

### Storage limits
All data lives in one versioned document in AsyncStorage on this device (`localStorage` on web). There is no backup or sync: clearing app data or uninstalling deletes it. If saved data can't be read, the app shows an error and leaves the data untouched. The Supabase client in `src/lib/supabase.ts` is not used in v1.

### Development
```bash
npm start           # Expo dev server
npm run typecheck   # tsc --noEmit
npm test            # week + shopping-transfer + persistence checks (node --test)
npx expo export --platform web
scripts/android-week-rollover.sh exp://<host>:8081   # midnight/resume refresh on a rooted Android emulator (changes its clock)
```
