
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL, INITIAL_ANALYSIS_PROMPT, TASK_GENERATION_PROMPT_TEMPLATE, TASK_COMPLETION_CELEBRATION_PROMPT_TEMPLATE } from '../constants';
import type { ImageAnalysisObservation, GeminiTaskResponseItem, Task } from '../types';

function base64ToGenerativePart(base64: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

function parseJsonFromGeminiResponse<T,>(responseText: string, fallbackValue: T, context?: 'observations' | 'tasks'): T {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    const parsed = JSON.parse(jsonStr);
    
    if (context === "observations" && (!Array.isArray(parsed) || (parsed.length > 0 && typeof parsed[0]?.description !== 'string'))) {
        console.warn("Parsed JSON for observations is not in expected format:", parsed);
        return fallbackValue;
    }
    if (context === "tasks" && (!Array.isArray(parsed) || (parsed.length > 0 && typeof parsed[0]?.text !== 'string'))) {
        console.warn("Parsed JSON for tasks is not in expected format:", parsed);
        return fallbackValue;
    }
    return parsed as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw response:", responseText);
    if (Array.isArray(fallbackValue) && fallbackValue.length === 0 && typeof responseText === 'string') { 
        if (context === "observations" && responseText.includes("description")) { 
             return responseText.split('\n').map(line => ({ description: line.trim() })).filter(obs => obs.description) as unknown as T;
        }
    }
    return fallbackValue;
  }
}


export const analyzeImageWithGemini = async (
  ai: GoogleGenAI,
  imageDataUrls: string[] 
): Promise<ImageAnalysisObservation[]> => {
  let allObservations: ImageAnalysisObservation[] = [];

  for (const imageDataUrl of imageDataUrls) {
    const parts: Part[] = [];
    
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      console.error("Invalid image data URL format:", imageDataUrl.substring(0, 50) + "...");
      continue; 
    }
    const mimeType = match[1];
    const base64Data = match[2];

    parts.push(base64ToGenerativePart(base64Data, mimeType));
    parts.push({ text: INITIAL_ANALYSIS_PROMPT });
    
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{ parts: parts }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const observations = parseJsonFromGeminiResponse<ImageAnalysisObservation[]>(response.text, [], "observations");
      
      if (!Array.isArray(observations) || (observations.length > 0 && typeof observations[0]?.description !== 'string')) {
          console.warn("Gemini analysis for one image did not return expected JSON structure. Response text:", response.text);
          if (typeof response.text === 'string' && response.text.trim().length > 0) {
            allObservations.push({description: `Could not parse structured analysis for an image. Raw AI output: ${response.text.substring(0,100)}...`});
          }
          continue; 
      }
      allObservations = allObservations.concat(observations);

    } catch (error) {
      console.error("Error analyzing one image with Gemini:", error);
      allObservations.push({ description: `Error analyzing one of the images: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  if (allObservations.length === 0 && imageDataUrls.length > 0) {
    // Return empty if no observations, let App.tsx handle messaging
    // throw new Error("AI image analysis failed for all provided images or returned no observations.");
  }
  return allObservations;
};

export const generateCleaningPlanWithGemini = async (
  ai: GoogleGenAI,
  analysis: ImageAnalysisObservation[]
): Promise<Partial<Task>[]> => { // Return type changed to Partial<Task>[]
  if (analysis.length === 0) {
    // Return empty array, App.tsx will handle messaging or allow manual add
    return []; 
  }
  const observationsText = analysis.map(obs => obs.description).join("\n");
  const prompt = TASK_GENERATION_PROMPT_TEMPLATE(observationsText);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ parts: [{text: prompt}] }],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const taskItems = parseJsonFromGeminiResponse<GeminiTaskResponseItem[]>(response.text, [], "tasks");

    if (!Array.isArray(taskItems) || (taskItems.length > 0 && typeof taskItems[0]?.text !== 'string')) {
        console.warn("Gemini task generation did not return expected JSON structure. Response text:", response.text);
        // Fallback: try to split raw text into simple tasks if it's just a list
        if (typeof response.text === 'string' && response.text.trim().length > 0) {
            return response.text.split('\n').map(t => ({ text: t.trim() })).filter(t => t.text.length > 0);
        }
        throw new Error("AI task generation result is not in the expected format and no fallback could be applied.");
    }
    
    if (taskItems.length === 0 && response.text.trim() !== "[]" && response.text.trim() !== "") { 
        return [{text: "AI returned an empty task list. Perhaps the area is already clean or the observations were unclear."}];
    }

    // Map GeminiTaskResponseItem to Partial<Task>
    return taskItems.map(item => ({
      text: item.text,
      estimatedTime: item.estimated_time,
      difficulty: item.difficulty_level,
      prioritizationHint: item.prioritization_hint,
    }));

  } catch (error) {
    console.error("Error generating cleaning plan with Gemini:", error);
    throw new Error(`AI task plan generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateCelebratoryMessageForTask = async (
  ai: GoogleGenAI,
  taskText: string
): Promise<string> => {
  if (!taskText) {
    return "Great job!"; // Fallback if task text is empty
  }
  const prompt = TASK_COMPLETION_CELEBRATION_PROMPT_TEMPLATE(taskText.split('@')[0].trim()); // Use main task text

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      // config: { responseMimeType: "text/plain" } // Default is text/plain
    });
    
    const celebrationText = response.text.trim();
    if (celebrationText) {
      return celebrationText;
    }
    // Fallback if AI returns empty string
    return `Well done with: ${taskText.split('@')[0].trim()}!`; 
  } catch (error) {
    console.error("Error generating celebratory message with Gemini:", error);
    // Fallback in case of error
    return `Excellent work on: ${taskText.split('@')[0].trim()}!`;
  }
};
