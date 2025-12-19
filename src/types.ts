export enum TripVibe {
  ROMANTIC = 'Romantic',
  ADVENTURE = 'Adventure',
  RELAXED = 'Relaxed',
  FOODIE = 'Foodie',
  CULTURAL = 'Cultural'
}

export type ActivityType = 'food' | 'sightseeing' | 'relaxation' | 'travel' | 'stay' | 'shopping' | 'drive' | 'other';

export interface Activity {
  id: string;
  time: string; // "09:00" or "14:30"
  title: string;
  description: string;
  location: string;
  customMapLink?: string; // specific google maps url
  wazeLink?: string; // specific waze url
  cost?: number; // JPY
  myrCost?: number; // Exact MYR
  type: ActivityType;
  notes?: string; 
  isBooked?: boolean;
  flightNo?: string;
  terminal?: string;
}

export interface DailyPlan {
  id: string;
  dayNumber: number;
  date?: string; 
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
  notes: string; 
  dailyPlans: DailyPlan[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingMetadata?: any; 
}