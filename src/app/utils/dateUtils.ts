// Create a new file utils/dateUtils.ts

/**
 * Standardizes a date to 6 AM UTC for consistent key generation
 * @param date The date to standardize
 * @returns An ISO string with time set to 06:00:00.000Z
 */
export const getStandardizedDateKey = (date: Date): string => {
    return new Date(date.toISOString().split('T')[0] + 'T06:00:00.000Z').toISOString();
};

/**
 * Converts a date to YYYY-MM-DD format for database storage
 * @param date The date to format
 * @returns A date string in YYYY-MM-DD format
 */
export const getDateForDatabase = (date: Date): string => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        .toISOString()
        .split('T')[0];
};

/**
 * Creates a standardized date with time set to 06:00:00.000Z
 * Preserves the local date while standardizing the time
 * @param date Optional date to standardize. If not provided, uses current date
 * @returns A new Date object standardized to 6 AM UTC
 */
export const createStandardizedDate = (date?: Date): Date => {
    const baseDate = date || new Date();
    // Get the local date components
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();
    
    // Create new date with same local date but at midnight UTC
    const standardized = new Date(Date.UTC(year, month, day, 6, 0, 0, 0));
    return standardized;
};

/**
 * Gets the Monday of the current week for any given date
 * @param date The date to get the Monday for. If not provided, uses current date
 * @returns A Date object representing Monday of the week, standardized to 6 AM UTC
 */
export const getMondayOfWeek = (date?: Date): Date => {
    const startingDate = date || new Date();
    
    const monday = new Date(startingDate);
    while (monday.getDay() !== 1) {
        monday.setDate(monday.getDate() - 1);
    }
    
    const standardizedMonday = createStandardizedDate(monday);
    
    return standardizedMonday;
};