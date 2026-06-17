export const formatDateTime = (value: any) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

/**
 * Returns current time in ISO format (e.g., "2025-08-12T17:34:50.879Z")
 * Returns UTC time in ISO format (standard for APIs)
 * Note: The 'Z' suffix indicates UTC timezone
 */
export const getCurrentTimeIST = (): string => {
    return new Date().toISOString();
};