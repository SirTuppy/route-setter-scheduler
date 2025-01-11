// config/holidays.ts

export interface Holiday {
    date: string; // Using YYYY-MM-DD format
    name: string;
}

export const holidays: Holiday[] = [
  { date: '2025-01-20', name: 'MLK Day' },
  { date: '2025-05-26', name: 'Memorial Day' },
  { date: '2025-07-04', name: 'Independence Day' },
  { date: '2025-09-01', name: 'Labor Day' },
  { date: '2025-11-27', name: 'Thanksgiving Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
];