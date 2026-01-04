// Utility functions

/**
 * Formats an ISO date string (YYYY-MM-DD) to a readable format
 * @param isoDate - ISO date string (e.g., "2023-03-31")
 * @param format - Format style: "short" (Mar 31, 2023) or "long" (March 31, 2023)
 * @returns Formatted date string or empty string if invalid
 */
export function formatReleaseDate(isoDate: string | undefined, format: 'short' | 'long' = 'short'): string {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const month = date.toLocaleString('en-US', { month: format });
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}
