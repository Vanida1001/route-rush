// Game constants. Pure data, no side effects.

export const SIZE = 7;

// Puzzle #1 is generated for this calendar day (local time). Change before launch.
export const LAUNCH_DATE = '2026-11-16';

export const TRAFFIC_DENSITY = { low: 0.1, medium: 0.18, high: 0.28 };

// Difficulty by JS weekday (0 = Sunday ... 6 = Saturday).
export const WEEKDAY_CONFIG = {
  1: { parcels: 4, capacity: 4, express: 0, traffic: 'low' },
  2: { parcels: 4, capacity: 3, express: 0, traffic: 'low' },
  3: { parcels: 5, capacity: 3, express: 1, traffic: 'medium' },
  4: { parcels: 5, capacity: 3, express: 1, traffic: 'medium' },
  5: { parcels: 6, capacity: 3, express: 1, traffic: 'medium' },
  6: { parcels: 6, capacity: 2, express: 2, traffic: 'high' },
  0: { parcels: 6, capacity: 3, express: 2, traffic: 'high' },
};

export const STAR_TOLERANCE = 1.15; // 2 stars: up to 15% above the optimum
