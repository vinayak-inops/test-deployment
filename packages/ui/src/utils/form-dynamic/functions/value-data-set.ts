/**
 * Validates if the gap between two dates is within the specified number of weeks
 * @param startDate - The start date in "YYYY-MM-DD" format
 * @param endDate - The end date in "YYYY-MM-DD" format
 * @param maxWeeks - Maximum number of weeks allowed between dates
 * @returns {boolean} - True if the gap is valid, false otherwise
 */
export function validateWeeklyGap(startDate: string, endDate: string, maxWeeks: number): boolean {
  // Convert string dates to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate date formats
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
  }

  // Calculate the difference in milliseconds
  const diffTime = Math.abs(end.getTime() - start.getTime());

  // Convert to weeks (milliseconds to weeks)
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

  // Check if the gap is within the specified weeks
  return diffWeeks <= maxWeeks;
}


// Utility function to get current date as a string in "YYYY-MM-DD" format
export function getCurrentDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a value from localStorage with type safety and error handling
 * @param key - The key to retrieve from localStorage
 * @param defaultValue - Optional default value if key doesn't exist
 * @returns The stored value or defaultValue
 */
export function getLocalStorageValue<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    return defaultValue || null;
  }
}

/**
 * Set a value in localStorage with error handling
 * @param key - The key to store the value under
 * @param value - The value to store
 * @returns boolean indicating success
 */
export function setLocalStorageValue<T>(key: string, value: T): boolean {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove a value from localStorage
 * @param key - The key to remove
 * @returns boolean indicating success
 */
export function removeLocalStorageValue(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get form data from localStorage with automatic type inference
 * @param formKey - The form identifier key
 * @returns The stored form data or null
 */
export function getFormDataFromStorage<T extends Record<string, any>>(formKey: string): T | null {
  const storageKey = `form_data_${formKey}`;
  return getLocalStorageValue<T>(storageKey);
}

/**
 * Save form data to localStorage
 * @param formKey - The form identifier key
 * @param formData - The form data to store
 * @returns boolean indicating success
 */
export function saveFormDataToStorage<T extends Record<string, any>>(formKey: string, formData: T): boolean {
  const storageKey = `form_data_${formKey}`;
  return setLocalStorageValue(storageKey, formData);
}

/**
 * Clear form data from localStorage
 * @param formKey - The form identifier key
 * @returns boolean indicating success
 */
export function clearFormDataFromStorage(formKey: string): boolean {
  const storageKey = `form_data_${formKey}`;
  return removeLocalStorageValue(storageKey);
}