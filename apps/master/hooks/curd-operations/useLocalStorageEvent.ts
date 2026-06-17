"use client";

import { useEffect } from "react";

export function useLocalStorageEvent(eventName: string) {
  useEffect(() => {
    // Dispatch custom event when localStorage is updated
    const triggerLocalStorageUpdate = (key: string) => {
      const event = new CustomEvent(eventName, {
        detail: { key },
      });
      window.dispatchEvent(event);
    };

    // Override localStorage.setItem
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, [key, value]);
      triggerLocalStorageUpdate(key);
    };

    return () => {
      localStorage.setItem = originalSetItem;
    };
  }, [eventName]);
}
