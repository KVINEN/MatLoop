# MatLoop

**Core Concept**
MatLoop transforms the weekly struggle of meal planning into a seamless, automated flow. No more wondering what to cook, what ingredients are hiding in the back of the freezer, or double-buying groceries.

The app bridges the gap between your meal plan, the grocery store, and your pantry. By combining an weekly menu with an smart shopping list, MatLoop calculates exactly what you need based on your current inventory. When you check out at the store, your household stock is automatically updated, creating a perfect loop of planning, buying, and cooking.

## v1: what works today

v1 is a local, single-device version of the loop:

- **Home**: this week's dinners (ISO week, Monday–Sunday). One free-text dinner per day, saved as you type; ✕ clears it. Earlier weeks stay saved; only the current week is shown.
- **Shopping**: add named items (duplicates are fine), tick them off as you shop, then **Finish shopping** to move the ticked items to the pantry.
- **Pantry**: everything you've bought. Remove an entry when it's used, eaten or spoiled.
- **Recipes**: text-only recipes (title, ingredients, steps). Search by title, open a recipe to read it, or create your own with **New recipe**. Three mock recipes come with a fresh install. No editing or deleting yet.

On Home, **Choose recipe** under a day opens a picker with title search; tapping a recipe copies its title into that day (replacing the dinner), Cancel leaves it unchanged, and the dinner stays free text you can edit or clear. The picker closes if the week rolls over.

Automatic shopping lists, quantities, accounts and sync are not in v1.

### Storage limits
All data lives in one versioned document in AsyncStorage on this device (`localStorage` on web). There is no backup or sync: clearing app data or uninstalling deletes it. The document is version 2 and also holds text recipes (title, ingredients, steps). A fresh install, or an upgrade from a valid version 1 document, gets three mock recipes once; after that the stored recipe list is used as is, even when empty. If saved data can't be read, the app shows an error and leaves the data untouched. The Supabase client in `src/lib/supabase.ts` is not used in v1.

### Development
```bash
npm start           # Expo dev server
npm run typecheck   # tsc --noEmit
npm test            # week + shopping-transfer + persistence checks (node --test)
npx expo export --platform web
scripts/android-week-rollover.sh exp://<host>:8081   # midnight/resume refresh on a rooted Android emulator (changes its clock)
```

### Automatic checks (GitHub Actions)
`.github/workflows/checks.yml` runs on pull requests, pushes to `main` and manual dispatch, in one Ubuntu job with Node 26.8.2 and a read-only token. It runs the same commands you can run locally:

```bash
npm ci
npm test
npm run typecheck
EXPO_NO_DOTENV=1 npx expo export --platform web   # no .env or secrets needed
```

This covers the domain logic tests, TypeScript and that the web bundle builds. It does **not** validate Android or iOS: a web export says nothing about native behaviour or keyboards. The workflow has no secrets, builds, signing or deployment, and no lint step (no linter is configured).

### Manual native checks
Before relying on a change, run `npx expo start --android` (or Expo Go on a device) and check:

- **Dinners**: type a dinner for a day, confirm it saves as you type and ✕ clears it; the on-screen keyboard doesn't hide the field.
- **Shopping transfer**: add items, tick some, **Finish shopping**; ticked items move to the pantry, unticked stay.
- **Pantry**: entries appear after shopping and can be removed.
- **Recipes**: search (e.g. ` PASTA `), open a recipe and go Back, create one with multiline ingredients/steps (blank fields are refused, Cancel discards), and confirm the keyboard doesn't hide the form fields.
- **Choose recipe**: on Home, pick a recipe for a day (search, select a seeded and a new recipe), confirm the input shows the title at once and it survives reload; Cancel/back and a no-result search leave the dinner alone; replace, edit and ✕ still work; the keyboard doesn't hide the picker search.

iOS is unverified until an iPhone is available.
