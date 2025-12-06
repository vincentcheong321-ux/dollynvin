import { GoogleGenAI, Type } from "@google/genai";
import { Trip, TripVibe } from '../types';

declare const process: { env: { API_KEY: string } };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to create IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateItinerary = async (destination: string, duration: number, vibe: TripVibe, notes: string): Promise<Trip> => {
  const prompt = `
    Create a detailed ${duration}-day trip itinerary for a couple going to ${destination}.
    The vibe should be ${vibe}.
    Special notes: ${notes}.
    
    Return the response in JSON format.
    Ensure 'type' is one of: 'food', 'sightseeing', 'relaxation', 'travel', 'stay', 'shopping', 'other'.
    Times should be in 24h format (e.g., "09:00", "14:00").
    
    CRITICAL: The 'cost' field MUST be an integer representing the estimated price in JPY (Japanese Yen). 
    Do not use strings like "Free", "Unknown", or "$10". If free, use 0. If unknown, estimate a number.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          destination: { type: Type.STRING },
          dailyPlans: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayNumber: { type: Type.INTEGER },
                theme: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      location: { type: Type.STRING },
                      cost: { type: Type.INTEGER, description: "Cost in JPY (Integer only)" },
                      type: { type: Type.STRING, enum: ['food', 'sightseeing', 'relaxation', 'travel', 'stay', 'shopping', 'other'] }
                    },
                    required: ["time", "title", "description", "location", "type", "cost"]
                  }
                }
              },
              required: ["dayNumber", "theme", "activities"]
            }
          }
        },
        required: ["title", "destination", "dailyPlans"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No itinerary generated");
  }

  const data = JSON.parse(response.text);
  
  // Transform into our internal Trip structure with IDs and Sanitize Data
  const trip: Trip = {
    id: generateId(),
    title: data.title,
    destination: data.destination,
    duration: duration,
    vibe: vibe,
    notes: notes,
    createdAt: Date.now(),
    dailyPlans: data.dailyPlans.map((dp: any) => ({
      id: generateId(),
      dayNumber: dp.dayNumber,
      theme: dp.theme,
      activities: dp.activities.map((act: any) => {
        // Double-check cost sanitization
        let safeCost = 0;
        if (typeof act.cost === 'number') {
          safeCost = act.cost;
        } else if (typeof act.cost === 'string') {
          // Attempt to strip non-numeric chars if the model hallucinates a string
          const num = parseInt(act.cost.replace(/[^0-9]/g, ''));
          safeCost = isNaN(num) ? 0 : num;
        }

        return {
          ...act,
          id: generateId(),
          cost: safeCost,
          isBooked: false
        };
      })
    }))
  };

  return trip;
};

export const sendChatMessage = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[],
  currentTripContext?: Trip
) => {
  let systemInstruction = "You are a helpful travel assistant for a couple. You are friendly, romantic, and organized.";
  
  if (currentTripContext) {
    const contextSummary = JSON.stringify({
      destination: currentTripContext.destination,
      days: currentTripContext.dailyPlans.map(d => ({
        day: d.dayNumber,
        theme: d.theme,
        activities: d.activities.map(a => `${a.time}: ${a.title} at ${a.location} (Cost: ¥${a.cost})`)
      })),
      notes: currentTripContext.notes
    });
    
    systemInstruction += `\n\nHere is the user's current planned itinerary data: ${contextSummary}.\n\nWhen they ask questions, refer to this specific itinerary if relevant (e.g., "How far is that from my dinner?").`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      tools: [{ googleMaps: {} }],
      systemInstruction: systemInstruction,
    }
  });

  return response;
};