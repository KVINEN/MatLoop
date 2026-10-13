import type { Recipe } from "./types.ts";

/** Mock recipes given to a fresh install or a v1 upgrade. */
export const seedRecipes: Recipe[] = [
  {
    id: "demo-recipe-tomato-pasta",
    title: "Tomato pasta",
    ingredients: "400 g spaghetti\n1 can crushed tomatoes\n2 cloves garlic\nOlive oil\nSalt",
    steps: "Boil the pasta in salted water.\nFry the garlic in olive oil, add the tomatoes and simmer for 10 minutes.\nToss the pasta in the sauce and serve.",
  },
  {
    id: "demo-recipe-vegetable-soup",
    title: "Vegetable soup",
    ingredients: "2 carrots\n1 leek\n2 potatoes\n1 l vegetable stock\nSalt and pepper",
    steps: "Chop the vegetables.\nSimmer them in the stock for 20 minutes.\nSeason and serve hot.",
  },
  {
    id: "demo-recipe-bean-tacos",
    title: "Bean tacos",
    ingredients: "1 can black beans\n8 small tortillas\n1 avocado\nSalsa\nLime",
    steps: "Warm the beans with a little salsa.\nFill the tortillas with beans and sliced avocado.\nFinish with lime juice.",
  },
];
