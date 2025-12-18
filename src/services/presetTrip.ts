
import { Trip, TripVibe } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createBlankTrip = (): Trip => {
  return {
    id: 'our-trip-id', // Fixed ID for single-trip couple usage
    title: "Our New Adventure",
    destination: "Somewhere Beautiful",
    duration: 1,
    vibe: TripVibe.ROMANTIC,
    notes: "",
    createdAt: Date.now(),
    dailyPlans: [
      {
        id: generateId(),
        dayNumber: 1,
        theme: "Day 1",
        activities: []
      }
    ]
  };
};
