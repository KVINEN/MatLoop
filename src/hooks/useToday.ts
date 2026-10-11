import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { msUntilNextDay, startOfDay } from "@/domain/week";

/** Today's local date at midnight; updates at midnight and when the app returns to the foreground. */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const refresh = () =>
      setToday((prev) => {
        const now = startOfDay(new Date());
        return now.getTime() === prev.getTime() ? prev : now;
      });
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, msUntilNextDay(new Date()) + 1000);
    };
    scheduleMidnight();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
