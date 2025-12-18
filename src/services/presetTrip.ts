
import { Trip, TripVibe } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createBlankTrip = (): Trip => {
  const themes = [
    "Arrival in Tokyo",
    "Cultural Tokyo",
    "Modern Vibes",
    "Art & Bay Views",
    "Relax & Pack",
    "Free Day in Tokyo",
    "Fly to Hokkaido & Drive",
    "Hakodate & Sakura",
    "Drive to Lake Toya",
    "Noboribetsu & Sapporo",
    "Otaru Day Trip",
    "Sapporo City",
    "Departure"
  ];

  return {
    id: 'our-trip-id',
    title: "Sakura Road Trip: Tokyo & Hokkaido",
    destination: "Japan",
    startDate: "2025-04-25",
    duration: 13,
    vibe: TripVibe.ROMANTIC,
    notes: "Flight Details:\n\n25 Apr: KUL (14:15) -> HND (22:15)\n01 May: HND (06:20) -> CTS (07:50)\n07 May: CTS (20:30) -> KUL (06:00 +1)\n\nFocus: Driving in Hokkaido for Sakura hunting.",
    createdAt: Date.now(),
    dailyPlans: themes.map((theme, index) => ({
      id: generateId(),
      dayNumber: index + 1,
      theme: theme,
      activities: []
    }))
  };
};
