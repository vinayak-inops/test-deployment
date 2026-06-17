import { useEffect, useState } from 'react';

interface FieldUpdate {
  feildnkeys: Array<{
    templateValue: string;
    value: any;
  }>;
}

interface FunctionItem {
  function: string;
  fieldsUpdate: FieldUpdate[];
}

interface LocalStorageData {
  functions?: FunctionItem[];
}

export const useLocalStorageSync = () => {
  const [localStorageData, setLocalStorageData] = useState<LocalStorageData | null>(null);

  // Return a function that accepts the localStorage key
  const getLocalStorageData = (key: string) => {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      try {
        const parsedValue: LocalStorageData = JSON.parse(storedValue);
        setLocalStorageData(parsedValue);
        return parsedValue;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  // Function to update localStorage data
  const updateLocalStorageData = (key: string, newData: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(newData));
      setLocalStorageData(newData);
      return newData;
    } catch (error) {
      return null;
    }
  };

  // Function to listen for changes
  const listenToLocalStorage = (key: string, callback: (data: any) => void) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        const newData = getLocalStorageData(key);
        callback(newData);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        const newData = getLocalStorageData(key);
        callback(newData);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  };

  return {
    getLocalStorageData,
    updateLocalStorageData,
    listenToLocalStorage,
    currentData: localStorageData
  };
}; 