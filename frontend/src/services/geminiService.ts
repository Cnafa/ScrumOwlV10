import { GoogleGenAI } from "@google/genai";

// As per guidelines, assume process.env.API_KEY is pre-configured and accessible.
// Initialize the client directly. The non-null assertion (!) is used as we are
// required to assume the key's existence.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates a concise summary for a work item using the Gemini API.
 * @param title - The title of the work item.
 * @param description - The description of the work item.
 * @returns A promise that resolves to the generated summary text.
 */
export const generateSummary = async (title: string, description: string): Promise<string> => {
  const prompt = `Based on the following title and description of a work item, please write a concise summary of 50 words or less, suitable for a quick overview. Do not use markdown.

Title: "${title}"

Description: "${description}"

Summary:`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    // Using the recommended .text property to extract the text
    const summaryText = response.text;
    if (!summaryText) {
      throw new Error("Received an empty response from the API.");
    }
    
    return summaryText.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Provide a more user-friendly error message
    throw new Error("Failed to generate summary due to an API error.");
  }
};
