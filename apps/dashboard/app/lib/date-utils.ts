import { format } from "date-fns"

/**
 * Formats the current date in the specified format
 * @param formatString The date-fns format string (default: 'd MMMM, yyyy')
 * @returns Formatted date string
 */
export function getCurrentDate(formatString = "d MMMM, yyyy"): string {
  return format(new Date(), formatString)
}

/**
 * Gets the current date object
 * @returns Current date as a Date object
 */
export function getToday(): Date {
  return new Date()
}
