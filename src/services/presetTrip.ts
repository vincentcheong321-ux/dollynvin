import { Trip, TripVibe } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const getPresetJapanTrip = (): Trip => {
  return {
    id: generateId(),
    title: "Sakura Road Trip: Tokyo & Hokkaido",
    destination: "Japan",
    startDate: "2025-04-25",
    duration: 13,
    vibe: TripVibe.ROMANTIC,
    notes: "Flight Details:\n\n25 Apr: KUL (14:15) -> HND (22:15)\n01 May: HND (06:20) -> CTS (07:50)\n07 May: CTS (20:30) -> KUL (06:00 +1)\n\nFocus: Driving in Hokkaido for Sakura hunting.",
    coverImage: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?q=80&w=2070&auto=format&fit=crop",
    createdAt: Date.now(),
    dailyPlans: [
      // --- TOKYO LEG ---
      {
        id: generateId(),
        dayNumber: 1,
        date: "2025-04-25",
        theme: "Arrival in Tokyo",
        activities: [
          {
            id: generateId(),
            time: "14:15",
            title: "Depart Malaysia",
            description: "Flight to Tokyo Haneda.",
            location: "KLIA",
            type: "travel",
            cost: 0,
            isBooked: true
          },
          {
            id: generateId(),
            time: "22:15",
            title: "Arrive at Haneda",
            description: "Land in Tokyo (10:15 PM). Clear immigration, collect wifi/sim cards.",
            location: "Haneda Airport (HND)",
            type: "travel",
            cost: 0,
            isBooked: true
          },
          {
            id: generateId(),
            time: "23:30",
            title: "Hotel Check-in",
            description: "Late check-in. Grab convenience store snacks (Konbini) for late dinner.",
            location: "Tokyo Hotel",
            type: "stay",
            cost: 15000,
            isBooked: true
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 2,
        date: "2025-04-26",
        theme: "Cultural Tokyo",
        activities: [
          {
            id: generateId(),
            time: "09:30",
            title: "Senso-ji Temple",
            description: "Visit the oldest temple in Tokyo and walk through Nakamise-dori.",
            location: "Asakusa",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "12:00",
            title: "Sushi Lunch",
            description: "Fresh sushi near the market area.",
            location: "Tsukiji Outer Market",
            type: "food",
            cost: 8000
          },
          {
            id: generateId(),
            time: "15:00",
            title: "Shopping in Ginza",
            description: "Walk through the high-end shopping district.",
            location: "Ginza",
            type: "shopping",
            cost: 20000
          },
          {
            id: generateId(),
            time: "19:00",
            title: "Dinner at Izakaya",
            description: "Casual drinking and dining experience.",
            location: "Shinjuku Omoide Yokocho",
            type: "food",
            cost: 6000
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 3,
        date: "2025-04-27",
        theme: "Modern Vibes",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Shibuya Crossing",
            description: "See the famous scramble crossing and Hachiko statue.",
            location: "Shibuya",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "11:30",
            title: "Shibuya Sky",
            description: "Observation deck with stunning views of the city.",
            location: "Scramble Square",
            type: "sightseeing",
            cost: 4400,
            isBooked: false
          },
          {
            id: generateId(),
            time: "15:00",
            title: "Harajuku & Omotesando",
            description: "Explore youth fashion and upscale architecture.",
            location: "Harajuku",
            type: "shopping",
            cost: 5000
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 4,
        date: "2025-04-28",
        theme: "Art & Bay Views",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "teamLab Planets",
            description: "Immersive digital art museum.",
            location: "Toyosu",
            type: "sightseeing",
            cost: 7600,
            isBooked: false
          },
          {
            id: generateId(),
            time: "13:00",
            title: "Lunch at Odaiba",
            description: "Lunch with view of Rainbow Bridge.",
            location: "Aqua City Odaiba",
            type: "food",
            cost: 4000
          },
          {
            id: generateId(),
            time: "15:00",
            title: "Unicorn Gundam",
            description: "See the giant transforming statue.",
            location: "DiverCity Tokyo Plaza",
            type: "sightseeing",
            cost: 0
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 5,
        date: "2025-04-29",
        theme: "Relax & Pack",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Meiji Jingu",
            description: "Peaceful forest shrine walk.",
            location: "Yoyogi Park",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "14:00",
            title: "Last Minute Shopping",
            description: "Don Quijote for snacks/supplies.",
            location: "Shinjuku",
            type: "shopping",
            cost: 15000
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 6,
        date: "2025-04-30",
        theme: "Free Day in Tokyo",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Free Day / Rest",
            description: "Easy day to explore missed spots.",
            location: "Tokyo",
            type: "relaxation",
            cost: 0
          },
          {
            id: generateId(),
            time: "20:00",
            title: "Pack for Hokkaido",
            description: "Prepare for early morning flight (6:20 AM tomorrow).",
            location: "Hotel",
            type: "relaxation",
            cost: 0
          }
        ]
      },

      // --- HOKKAIDO LEG ---
      {
        id: generateId(),
        dayNumber: 7,
        date: "2025-05-01",
        theme: "Fly to Hokkaido & Drive",
        activities: [
          {
            id: generateId(),
            time: "06:20",
            title: "Flight to Sapporo",
            description: "Depart Haneda (HND) to New Chitose (CTS).",
            location: "Haneda Airport",
            type: "travel",
            cost: 20000,
            isBooked: true
          },
          {
            id: generateId(),
            time: "07:50",
            title: "Arrive Hokkaido",
            description: "Land at New Chitose. Pick up rental car.",
            location: "New Chitose Airport",
            type: "travel",
            cost: 60000,
            notes: "Car Rental Booking #HOK-123",
            isBooked: true
          },
          {
            id: generateId(),
            time: "10:30",
            title: "Drive to Matsumae Park",
            description: "Drive south to see the famous Sakura castle park.",
            location: "Matsumae Park",
            type: "sightseeing",
            cost: 1000
          },
          {
            id: generateId(),
            time: "18:00",
            title: "Check-in Hakodate",
            description: "Stay overnight in Hakodate area.",
            location: "Hakodate Hotel",
            type: "stay",
            cost: 18000,
            isBooked: false
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 8,
        date: "2025-05-02",
        theme: "Hakodate & Sakura",
        activities: [
          {
            id: generateId(),
            time: "09:00",
            title: "Fort Goryokaku",
            description: "Star-shaped fort filled with cherry blossoms.",
            location: "Goryokaku Tower",
            type: "sightseeing",
            cost: 2000
          },
          {
            id: generateId(),
            time: "12:00",
            title: "Lucky Pierrot Burger",
            description: "Famous local burger chain only in Hakodate.",
            location: "Hakodate",
            type: "food",
            cost: 2500
          },
          {
            id: generateId(),
            time: "18:00",
            title: "Mt. Hakodate Night View",
            description: "One of the best three night views in Japan.",
            location: "Mt. Hakodate",
            type: "sightseeing",
            cost: 3000
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 9,
        date: "2025-05-03",
        theme: "Drive to Lake Toya",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Drive North",
            description: "Scenic drive towards Lake Toya.",
            location: "Hokkaido Expressway",
            type: "travel",
            cost: 3000
          },
          {
            id: generateId(),
            time: "14:00",
            title: "Lake Toya",
            description: "Relax by the caldera lake.",
            location: "Lake Toya",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "19:00",
            title: "Onsen Hotel",
            description: "Relax in hot springs with lake view.",
            location: "Toya Onsen",
            type: "stay",
            cost: 25000,
            isBooked: false
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 10,
        date: "2025-05-04",
        theme: "Noboribetsu & Sapporo",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Jigokudani (Hell Valley)",
            description: "Steam vents and sulfur streams.",
            location: "Noboribetsu",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "14:00",
            title: "Drive to Sapporo",
            description: "Head to the capital city.",
            location: "Sapporo",
            type: "travel",
            cost: 2000
          },
          {
            id: generateId(),
            time: "18:00",
            title: "Genghis Khan Dinner",
            description: "Famous Hokkaido grilled lamb BBQ.",
            location: "Susukino",
            type: "food",
            cost: 8000
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 11,
        date: "2025-05-05",
        theme: "Otaru Day Trip",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Drive to Otaru",
            description: "Short drive to the port city.",
            location: "Otaru",
            type: "travel",
            cost: 0
          },
          {
            id: generateId(),
            time: "11:00",
            title: "Otaru Canal",
            description: "Walk along the historic canal and glass shops.",
            location: "Otaru Canal",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "13:00",
            title: "Kaisendon Lunch",
            description: "Fresh seafood bowl at Sankaku Market.",
            location: "Otaru Station",
            type: "food",
            cost: 6000
          },
          {
            id: generateId(),
            time: "15:00",
            title: "LeTAO Cheesecake",
            description: "Dessert break.",
            location: "Otaru",
            type: "food",
            cost: 2000
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 12,
        date: "2025-05-06",
        theme: "Sapporo City",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Odori Park",
            description: "Walk through the park, see TV Tower.",
            location: "Odori",
            type: "sightseeing",
            cost: 0
          },
          {
            id: generateId(),
            time: "13:00",
            title: "Soup Curry",
            description: "Try the local specialty spicy soup curry.",
            location: "Suage+",
            type: "food",
            cost: 3000
          },
          {
            id: generateId(),
            time: "15:00",
            title: "Shiroi Koibito Park",
            description: "Chocolate factory tour.",
            location: "Nishi-ku",
            type: "sightseeing",
            cost: 1600
          }
        ]
      },
      {
        id: generateId(),
        dayNumber: 13,
        date: "2025-05-07",
        theme: "Departure",
        activities: [
          {
            id: generateId(),
            time: "10:00",
            title: "Rera Outlet Mall",
            description: "Last minute shopping near airport.",
            location: "Chitose",
            type: "shopping",
            cost: 20000
          },
          {
            id: generateId(),
            time: "17:00",
            title: "Return Rental Car",
            description: "Drop off vehicle at rental branch. Shuttle to terminal.",
            location: "CTS Rental Branch",
            type: "travel",
            cost: 0
          },
          {
            id: generateId(),
            time: "20:30",
            title: "Flight Home",
            description: "Depart for Kuala Lumpur (8:30 PM).",
            location: "New Chitose Airport",
            type: "travel",
            cost: 0,
            isBooked: true
          }
        ]
      }
    ]
  };
};