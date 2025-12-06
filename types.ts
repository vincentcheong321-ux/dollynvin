
export enum TripVibe {
  ROMANTIC = 'Romantic',
  ADVENTURE = 'Adventure',
  RELAXED = 'Relaxed',
  FOODIE = 'Foodie',
  CULTURAL = 'Cultural'
}

export type ActivityType = 'food' | 'sightseeing' | 'relaxation' | 'travel' | 'stay' | 'shopping' | 'other';

export interface Activity {
  id: string;
  time: string; // "09:00" or "14:30"
  title: string;
  description: string;
  location: string;
  customMapLink?: string; // specific google maps url
  cost?: number; // Changed to number
  type: ActivityType;
  notes?: string; // For reservation numbers, booking refs, etc.
  isBooked?: boolean;
}

export interface DailyPlan {
  id: string;
  dayNumber: number;
  date?: string; // Optional specific date string
  theme?: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate?: string; // YYYY-MM-DD
  duration: number;
  vibe: TripVibe;
  coverImage?: string;
  notes: string; // General trip notes (Flight #, Hotel Address)
  dailyPlans: DailyPlan[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingMetadata?: any; 
}