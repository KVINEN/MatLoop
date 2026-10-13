import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useCallback, useEffect, useReducer, useState, type ReactNode } from "react";

import { createPersistence, type SaveState } from "@/domain/persist";
import { finishShopping, newId, normalizeName, normalizeRecipe, reduce, type Action } from "@/domain/state";
import { emptyData, type AppData } from "@/domain/types";

type StoreState = {
  data: AppData;
  /** Rows moved by the latest "Finish shopping", shown as feedback until the next change. */
  lastMoved: number | null;
};

type StoreAction = Action | { type: "hydrated"; data: AppData };

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "hydrated":
      return { data: action.data, lastMoved: null };
    case "finishShopping": {
      const { data, moved } = finishShopping(state.data);
      return moved === 0 ? state : { data, lastMoved: moved };
    }
    default:
      return { data: reduce(state.data, action), lastMoved: null };
  }
}

type Hydration = { status: "loading" } | { status: "ready" } | { status: "error"; message: string };

type Store = {
  hydration: Hydration;
  retryLoad: () => void;
  saveState: SaveState;
  retrySave: () => void;
  data: AppData;
  lastMoved: number | null;
  setDinner: (weekKey: string, day: number, text: string) => void;
  /** Returns false when the name is blank. */
  addItem: (name: string) => boolean;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  finishShopping: () => void;
  removePantry: (id: string) => void;
  /** Returns false when any field is blank. */
  addRecipe: (input: { title: string; ingredients: string; steps: string }) => boolean;
};

const StoreContext = createContext<Store | null>(null);

export function ShoppingStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, { data: emptyData, lastMoved: null });
  const [hydration, setHydration] = useState<Hydration>({ status: "loading" });
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [persistence] = useState(() => createPersistence(AsyncStorage, setSaveState));

  const load = useCallback(() => {
    setHydration({ status: "loading" });
    persistence.load().then(
      (data) => {
        dispatch({ type: "hydrated", data });
        setHydration({ status: "ready" });
      },
      (error: unknown) => setHydration({ status: "error", message: String(error) }),
    );
  }, [persistence]);

  useEffect(load, [load]);

  const ready = hydration.status === "ready";
  useEffect(() => {
    if (ready) persistence.save(state.data);
  }, [ready, persistence, state.data]);

  const store: Store = {
    hydration,
    retryLoad: load,
    saveState,
    retrySave: () => persistence.save(state.data),
    data: state.data,
    lastMoved: state.lastMoved,
    setDinner: (weekKey, day, text) => dispatch({ type: "setDinner", weekKey, day, text }),
    addItem: (name) => {
      if (normalizeName(name) === null) return false;
      dispatch({ type: "addItem", id: newId(), name });
      return true;
    },
    removeItem: (id) => dispatch({ type: "removeItem", id }),
    toggleItem: (id) => dispatch({ type: "toggleItem", id }),
    finishShopping: () => dispatch({ type: "finishShopping" }),
    removePantry: (id) => dispatch({ type: "removePantry", id }),
    addRecipe: ({ title, ingredients, steps }) => {
      if (normalizeRecipe({ title, ingredients, steps }) === null) return false;
      dispatch({ type: "addRecipe", id: newId(), title, ingredients, steps });
      return true;
    },
  };

  return <StoreContext value={store}>{children}</StoreContext>;
}

export function useShoppingStore(): Store {
  const store = use(StoreContext);
  if (store === null) throw new Error("useShoppingStore must be used inside ShoppingStoreProvider");
  return store;
}
