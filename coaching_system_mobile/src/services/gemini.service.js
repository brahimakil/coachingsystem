import { GoogleGenAI } from "@google/genai";

// Global model configuration
export const GEMINI_MODEL = "gemini-2.5-flash";

let aiInstance = null;

// Initialize AI with API key
export const initializeAI = (apiKey) => {
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

// Get AI instance
export const getAI = () => {
  return aiInstance;
};

// Test AI connection
export const testAIConnection = async (apiKey) => {
  try {
    const testAI = new GoogleGenAI({ apiKey });
    const response = await testAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: "How does AI work?",
    });
    return { success: true, response: response.text };
  } catch (error) {
    console.error('AI test failed:', error);
    return { success: false, error: error.message };
  }
};

// Generate content using the global model with optional chat history
export const generateContent = async (prompt, chatHistory = []) => {
  try {
    const ai = getAI();
    
    // If chat history is provided, use it for context
    let contents;
    if (chatHistory.length > 0) {
      // Add the new prompt to the history
      contents = [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];
    } else {
      // Simple prompt without history
      contents = prompt;
    }
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
    });
    
    return response.text;
  } catch (error) {
    console.error('Generation failed:', error);
    throw error;
  }
};
