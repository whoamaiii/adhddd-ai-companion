
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

/**
 * Parses a JSON string, potentially extracted from a fenced code block,
 * with specific validation for observation and task structures.
 *
 * @template T The expected type of the parsed JSON.
 * @param {string} responseText The raw response text from the AI.
 * @param {T} fallbackValue The value to return if parsing or validation fails.
 * @param {('observations' | 'tasks')} [context] Optional context for validation.
 *    - 'observations': Expects an array of objects with a 'description' string property.
 *    - 'tasks': Expects an array of objects with a 'text' string property.
 * @returns {T} The parsed and validated JSON object, or the fallbackValue.
 */
function parseJsonFromGeminiResponse<T>(
  responseText: string,
  fallbackValue: T,
  context?: 'observations' | 'tasks'
): T {
  let jsonStr = responseText.trim();

  // Extract content from markdown code fences if present
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    // Attempt to parse the string as JSON
    const parsed = JSON.parse(jsonStr);

    // Validate structure based on context
    if (context === "observations") {
      if (!Array.isArray(parsed) || (parsed.length > 0 && (typeof parsed[0] !== 'object' || parsed[0] === null || typeof parsed[0].description !== 'string'))) {
        console.warn("Parsed JSON for 'observations' is not in the expected format (Array<{description: string}>):", parsed);
        return fallbackValue;
      }
    } else if (context === "tasks") {
      if (!Array.isArray(parsed) || (parsed.length > 0 && (typeof parsed[0] !== 'object' || parsed[0] === null || typeof parsed[0].text !== 'string'))) {
        console.warn("Parsed JSON for 'tasks' is not in the expected format (Array<{text: string}>):", parsed);
        return fallbackValue;
      }
    }

    return parsed as T;

  } catch (e) {
    console.error("Failed to parse JSON response:", e, "\nRaw response text:", responseText);
    // The initial very naive fallback of splitting by newline is removed as it's too unreliable.
    // The calling functions (analyzeImageWithGemini, generateCleaningPlanWithGemini)
    // are now more responsible for handling cases where parsing fails and fallbackValue is returned.
    return fallbackValue;
  }
}

/**
 * Analyzes images using Gemini AI to identify observations.
 *
 * @param {GoogleGenAI} ai The GoogleGenAI instance.
 * @param {string[]} imageDataUrls Array of base64 encoded image data URLs.
 * @returns {Promise<ImageAnalysisObservation[]>} A promise that resolves to an array of image analysis observations.
 */
export const analyzeImageWithGemini = async (
  ai: GoogleGenAI,
  imageDataUrls: string[]
): Promise<ImageAnalysisObservation[]> => {
  let allObservations: ImageAnalysisObservation[] = [];

  for (const imageDataUrl of imageDataUrls) {
    const parts: Part[] = [];
    
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      console.error("Invalid image data URL format (first 50 chars):", imageDataUrl.substring(0, 50) + "...");
      // Optionally add a user-facing error observation, or let the overall result be empty
      // allObservations.push({ description: "Error: Invalid image data format provided." });
      continue; 
    }
    const mimeType = match[1];
    const base64Data = match[2];

    parts.push(base64ToGenerativePart(base64Data, mimeType));
    parts.push({ text: INITIAL_ANALYSIS_PROMPT });
    
    try {
      const result = await ai.getGenerativeModel({ model: GEMINI_TEXT_MODEL })
        .generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json"},
        });

      const response = result.response;
      const responseText = response.text(); // Ensure text() is called to get the string

      // Use the improved parser. Fallback is an empty array.
      const observations = parseJsonFromGeminiResponse<ImageAnalysisObservation[]>(responseText, [], "observations");
      
      // The parser now returns fallbackValue if validation fails, so this specific check might be redundant
      // but kept for explicitness if the definition of "valid" observation changes.
      if (!Array.isArray(observations) || (observations.length > 0 && typeof observations[0]?.description !== 'string')) {
          console.warn("Gemini analysis for an image did not return the expected JSON structure. Response text:", responseText);
          // Add a generic error observation if parsing failed or structure is wrong, and responseText is non-empty
          if (typeof responseText === 'string' && responseText.trim().length > 0) {
            allObservations.push({description: `AI analysis issue: Could not parse structured data. Raw output (first 100 chars): ${responseText.substring(0,100)}...`});
          }
          // Continue to next image
      } else {
        allObservations = allObservations.concat(observations);
      }

    } catch (error) {
      console.error("Error analyzing one image with Gemini:", error);
      allObservations.push({ description: `Error during AI image analysis: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  // No explicit throw here; App.tsx handles empty observation list.
  return allObservations;
};

/**
 * Generates a cleaning plan with Gemini AI based on image analysis observations.
 *
 * @param {GoogleGenAI} ai The GoogleGenAI instance.
 * @param {ImageAnalysisObservation[]} analysis Array of image analysis observations.
 * @returns {Promise<Partial<Task>[]>} A promise that resolves to an array of partial tasks.
 */
export const generateCleaningPlanWithGemini = async (
  ai: GoogleGenAI,
  analysis: ImageAnalysisObservation[]
): Promise<Partial<Task>[]> => {
  if (analysis.length === 0) {
    return []; // No observations, no plan.
  }
  const observationsText = analysis.map(obs => obs.description).join("\n");
  const prompt = TASK_GENERATION_PROMPT_TEMPLATE(observationsText);

  try {
    const result = await ai.getGenerativeModel({ model: GEMINI_TEXT_MODEL })
      .generateContent({
        contents: [{ role: "user", parts: [{text: prompt}] }],
        generationConfig: { responseMimeType: "application/json" },
      });

    const response = result.response;
    const responseText = response.text();

    const taskItems = parseJsonFromGeminiResponse<GeminiTaskResponseItem[]>(responseText, [], "tasks");

    // If taskItems is empty after parsing AND the raw response wasn't just "[]" or ""
    // it implies parsing might have failed or AI gave non-JSON text.
    if (taskItems.length === 0 && responseText.trim() !== "[]" && responseText.trim() !== "") {
        console.warn("Gemini task generation returned empty after parsing, but raw response was not empty. Raw response:", responseText);
        // Fallback: Create a single task indicating an issue.
        return [{text: "AI task generation issue: Could not parse a structured plan. Please try again or add tasks manually."}];
    }
    
    // If AI legitimately returns an empty list of tasks (e.g. room is clean)
    if (taskItems.length === 0 && (responseText.trim() === "[]" || responseText.trim() === "")) {
        return [{text: "AI suggests no specific tasks are needed for this area, or the observations were unclear."}];
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

/**
 * Generates a short, positive celebratory message for a completed task using Gemini AI.
 * Includes fallbacks for empty task text, empty AI response, or AI errors.
 *
 * @param {GoogleGenAI} ai The GoogleGenAI instance.
 * @param {string} taskText The text of the task that was completed.
 *        The part of the text before the first "@" symbol is used for the prompt if "@" is present.
 * @returns {Promise<string>} A promise that resolves to a celebratory message string.
 */
export const generateCelebratoryMessageForTask = async (
  ai: GoogleGenAI,
  taskText: string
): Promise<string> => {
  if (!taskText) {
    return "Great job!"; // Fallback for empty task text.
  }
  // Use the main part of the task text for the prompt, in case of conventions like "@location".
  const promptText = taskText.split('@')[0].trim();
  const prompt = TASK_COMPLETION_CELEBRATION_PROMPT_TEMPLATE(promptText);

  try {
    // Note: The new SDK syntax is ai.getGenerativeModel(...).generateContent(...)
    // This code appears to use an older or mixed syntax.
    // For consistency with other functions, this should be updated if possible.
    // However, if `ai.models.generateContent` is a valid shorthand or different API part, it might be intentional.
    // Assuming it works as is for now.
    const generativeModel = ai.getGenerativeModel({ model: GEMINI_TEXT_MODEL });
    const result = await generativeModel.generateContent({ contents: [{ parts: [{ text: prompt }] }] });
    const response = result.response;
    
    const celebrationText = response.text().trim();
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
