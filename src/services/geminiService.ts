
import { GoogleGenAI } from "@google/genai";
import { Trip } from '../types';

export const sendChatMessage = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[],
  currentTripContext: Trip
) => {
  // Always initialize inside the call for clean key access
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "You are a helpful travel assistant for a couple. You are friendly, romantic, and organized.";
  
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: systemInstruction,
    }
  });

  return response;
};
