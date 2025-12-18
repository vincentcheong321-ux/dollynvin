
import { Trip, TripVibe } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createBlankTrip = (): Trip => {
  const themes = [
    "Arrival in Tokyo",
    "Cultural Tokyo (Asakusa Focus)",
    "Tokyo Disneyland Magic",
    "Modern Vibes (Shibuya & Shinjuku)",
    "Art & Bay Views (teamLab)",
    "Free Day / Souvenir Hunting",
    "Fly to Hokkaido & Drive",
    "Hakodate & Sakura",
    "Drive to Lake Toya",
    "Noboribetsu & Sapporo",
    "Otaru Day Trip",
    "Sapporo City Explorer",
    "Departure"
  ];

  const trip: Trip = {
    id: 'our-trip-id',
    title: "Sakura Road Trip: Tokyo & Hokkaido",
    destination: "Japan",
    startDate: "2025-04-25",
    duration: 13,
    vibe: TripVibe.ROMANTIC,
    notes: "Home Base: Airbnb in Asakusa.\n\nFlight Details:\n25 Apr: KUL -> HND (22:15)\n01 May: HND -> CTS (07:50)\n07 May: CTS -> KUL (20:30)\n\nNotes: Focus on local food and Sakura viewing.",
    createdAt: Date.now(),
    dailyPlans: themes.map((theme, index) => ({
      id: generateId(),
      dayNumber: index + 1,
      theme: theme,
      activities: []
    }))
  };

  // Populate Day 3 with Disneyland Plan as requested
  const day3 = trip.dailyPlans[2];
  day3.activities = [
    {
      id: generateId(),
      time: "07:00",
      title: "Early Breakfast & Coffee",
      description: "Quick breakfast at the Airbnb or grab something from the nearby FamilyMart in Asakusa.",
      location: "Asakusa Airbnb",
      type: "food",
      cost: 1500
    },
    {
      id: generateId(),
      time: "07:45",
      title: "Travel to Disneyland",
      description: "Take the Ginza Line to Ueno, transfer to Hibiya Line to Hatchobori, then JR Keiyo Line to Maihama. Takes approx 45-50 mins.",
      location: "Maihama Station",
      type: "travel",
      cost: 800
    },
    {
      id: generateId(),
      time: "08:30",
      title: "Queue at Main Gate",
      description: "Arrive early to queue. The park often opens slightly earlier than official time (usually 8:45 or 9:00).",
      location: "Tokyo Disneyland",
      type: "sightseeing",
      cost: 18000,
      isBooked: true
    },
    {
      id: generateId(),
      time: "12:30",
      title: "Lunch at Queen of Hearts",
      description: "Alice in Wonderland themed banquet hall. Great for photos and decent food portions.",
      location: "Fantasyland",
      type: "food",
      cost: 5000
    },
    {
      id: generateId(),
      time: "19:00",
      title: "Dinner at Blue Bayou",
      description: "Fine dining inside the Pirates of the Caribbean ride. Atmosphere is incredible.",
      location: "Adventureland",
      type: "food",
      cost: 12000,
      notes: "Requires advance reservation!"
    },
    {
      id: generateId(),
      time: "20:00",
      title: "Electrical Parade Dreamlights",
      description: "The iconic night parade. Find a spot near the hub or Westernland 30 mins early.",
      location: "Park Wide",
      type: "sightseeing",
      cost: 0
    },
    {
      id: generateId(),
      time: "21:30",
      title: "Return to Asakusa",
      description: "Reverse route back to the Airbnb. Be prepared for crowds at Maihama station.",
      location: "Asakusa",
      type: "travel",
      cost: 800
    }
  ];

  return trip;
};
