
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL, INITIAL_ANALYSIS_PROMPT, TASK_GENERATION_PROMPT_TEMPLATE, TASK_COMPLETION_CELEBRATION_PROMPT_TEMPLATE, SENSORY_INSIGHT_PROMPT_TEMPLATE } from '../constants';
import type { ImageAnalysisObservation, GeminiTaskResponseItem, Task, SensoryMoment } from '../types';

/**
 * Converts a base64 encoded image string to a GenerativePart object for the Gemini API.
 * @param base64 The base64 encoded image data.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @returns A Part object suitable for the Gemini API.
 */
function base64ToGenerativePart(base64: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

/**
 * Parses a JSON string from a Gemini API response, with robust error handling.
 * It handles responses that might be wrapped in markdown code fences.
 * @param responseText The raw text from the Gemini API response.
 * @param fallbackValue A default value to return if parsing fails.
 * @param context A string to identify the type of data being parsed ('observations' or 'tasks') for more specific validation.
 * @returns The parsed JSON object, or the fallback value.
 */
function parseJsonFromGeminiResponse<T,>(responseText: string, fallbackValue: T, context?: 'observations' | 'tasks'): T {
  let jsonStr = responseText.trim();
  // Regex to strip markdown fences (```json ... ```)
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Basic validation to ensure the parsed object has the expected shape
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
    // Fallback for simple list-like text responses
    if (Array.isArray(fallbackValue) && fallbackValue.length === 0 && typeof responseText === 'string') {
        if (context === "observations" && responseText.includes("description")) {
             return responseText.split('\n').map(line => ({ description: line.trim() })).filter(obs => obs.description) as unknown as T;
        }
    }
    return fallbackValue;
  }
}

/**
 * Analyzes one or more images using the Gemini API to identify objects and areas of interest.
 * @param ai The initialized GoogleGenAI client.
 * @param imageDataUrls An array of data URLs for the images to be analyzed.
 * @returns A promise that resolves to an array of observations.
 */
export const analyzeImageWithGemini = async (
  ai: GoogleGenAI,
  imageDataUrls: string[]
): Promise<ImageAnalysisObservation[]> => {
  let allObservations: ImageAnalysisObservation[] = [];

  for (const imageDataUrl of imageDataUrls) {
    const parts: Part[] = [];
    
    // Extract mime type and base64 data from the data URL
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

      const responseText = response.text ?? '';
      const observations = parseJsonFromGeminiResponse<ImageAnalysisObservation[]>(responseText, [], "observations");
      
      // Validate the structure of the parsed observations
      if (!Array.isArray(observations) || (observations.length > 0 && typeof observations[0]?.description !== 'string')) {
          console.warn("Gemini analysis for one image did not return expected JSON structure. Response text:", responseText);
          if (typeof responseText === 'string' && responseText.trim().length > 0) {
            allObservations.push({description: `Could not parse structured analysis for an image. Raw AI output: ${responseText.substring(0,100)}...`});
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
    // If no observations are generated, App.tsx will handle the user message.
  }
  return allObservations;
};

/**
 * Generates a cleaning plan based on a list of observations from the image analysis.
 * @param ai The initialized GoogleGenAI client.
 * @param analysis An array of observations from the `analyzeImageWithGemini` function.
 * @returns A promise that resolves to an array of task objects.
 */
export const generateCleaningPlanWithGemini = async (
  ai: GoogleGenAI,
  analysis: ImageAnalysisObservation[]
): Promise<Partial<Task>[]> => {
  if (analysis.length === 0) {
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
    
    const responseText = response.text ?? '';
    const taskItems = parseJsonFromGeminiResponse<GeminiTaskResponseItem[]>(responseText, [], "tasks");

    // Validate the structure of the generated tasks
    if (!Array.isArray(taskItems) || (taskItems.length > 0 && typeof taskItems[0]?.text !== 'string')) {
        console.warn("Gemini task generation did not return expected JSON structure. Response text:", responseText);
        // Fallback for plain text lists
        if (typeof responseText === 'string' && responseText.trim().length > 0) {
            return responseText.split('\n').map(t => ({ text: t.trim() })).filter(t => t.text.length > 0);
        }
        throw new Error("AI task generation result is not in the expected format and no fallback could be applied.");
    }
    
    if (taskItems.length === 0 && responseText.trim() !== "[]" && responseText.trim() !== "") {
        return [{text: "AI returned an empty task list. Perhaps the area is already clean or the observations were unclear."}];
    }

    // Map the response to the Task partial type
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

/**
 * Generates personalized sensory insights based on logged data.
 * @param ai The initialized GoogleGenAI client.
 * @param moments An array of SensoryMoment objects.
 * @returns A promise that resolves to a string containing the AI-generated insight.
 */
export const generateSensoryInsights = async (
  ai: GoogleGenAI,
  moments: SensoryMoment[]
): Promise<string> => {
  if (moments.length === 0) {
    return "No data available to generate insights.";
  }

  // Format the moments data into a string for the prompt.
  // We'll select key fields to keep the input concise.
  const formattedMomentsData = JSON.stringify(
    moments.map(moment => ({
      timestamp: moment.timestamp,
      overallState: moment.overallState,
      behaviors: moment.behaviors,
      environment: moment.environment,
    }))
  );

  const prompt = SENSORY_INSIGHT_PROMPT_TEMPLATE(formattedMomentsData);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });

    const insightText = response.text?.trim() ?? '';

    if (!insightText) {
      return "Could not generate insights at this time. Please try again later.";
    }
    return insightText;

  } catch (error) {
    console.error("Error generating sensory insights with Gemini:", error);
    return `An error occurred while generating insights: ${error instanceof Error ? error.message : String(error)}`;
  }
};

/**
 * Generates a celebratory message for a completed task.
 * @param ai The initialized GoogleGenAI client.
 * @param taskText The text of the task that was completed.
 * @returns A promise that resolves to a celebratory string.
 */
export const generateCelebratoryMessageForTask = async (
  ai: GoogleGenAI,
  taskText: string
): Promise<string> => {
  if (!taskText) {
    return "Great job!"; // Fallback for an empty task text
  }
  // Use only the main part of the task text for the prompt
  const prompt = TASK_COMPLETION_CELEBRATION_PROMPT_TEMPLATE(taskText.split('@')[0].trim());

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    const celebrationText = response.text?.trim() ?? '';
    if (celebrationText) {
      return celebrationText;
    }
    // Fallback if the AI returns an empty string
    return `Well done with: ${taskText.split('@')[0].trim()}!`;
  } catch (error) {
    console.error("Error generating celebratory message with Gemini:", error);
    // Fallback in case of an API error
    return `Excellent work on: ${taskText.split('@')[0].trim()}!`;
  }
};
