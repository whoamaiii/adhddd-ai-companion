
/** @constant {string} GEMINI_TEXT_MODEL The specific Gemini model used for text generation and multimodal analysis. */
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

/** @constant {string} GEMINI_IMAGE_MODEL Placeholder for a specific Gemini model if image generation were needed. Currently not used for generation in this app. */
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002";

/** @constant {number} MAX_FILE_SIZE_MB Maximum allowed image file size in megabytes for upload. */
export const MAX_FILE_SIZE_MB = 5;

/**
 * @constant {string} INITIAL_ANALYSIS_PROMPT
 * Prompt for Gemini to analyze images of messy rooms.
 * Instructs the AI to identify clutter, focus on actionable items, and return observations
 * as a JSON array of objects, each with a "description" field.
 * This structure is crucial for `parseJsonFromGeminiResponse` to correctly process the output.
 */
export const INITIAL_ANALYSIS_PROMPT = `
You are an expert at analyzing images of messy rooms to help someone with ADHD clean.
Given the image, identify key objects, their locations, and general areas of clutter.
Focus on actionable items. For example: "scattered clothes on the floor near the bed", "multiple coffee mugs and wrappers on the desk", "overflowing trash can in the corner".
Provide your analysis as a JSON array of objects, where each object has a "description" field containing the observation string.
Example output format:
[
  {"description": "Scattered clothes on the floor near the bed."},
  {"description": "Pile of books and papers on the nightstand."},
  {"description": "Overflowing trash can next to the desk."}
]
`;

/**
 * Generates a prompt for Gemini to create a cleaning plan based on observations.
 *
 * @param {string} observationsText A string containing newline-separated observations from the image analysis.
 * @returns {string} A formatted prompt string for the AI.
 * This prompt guides the AI to:
 * - Act as an ADHD productivity coach.
 * - Create a step-by-step plan using the provided observations.
 * - Optimize the plan for ADHD brains (easy wins, small tasks, encouraging tone, focus).
 * - Structure the output as a JSON array of objects, where each object represents a task
 *   and includes "text", "estimated_time", "difficulty_level", and optional "prioritization_hint".
 * This JSON structure is critical for `parseJsonFromGeminiResponse` and subsequent processing in `App.tsx`.
 */
export const TASK_GENERATION_PROMPT_TEMPLATE = (observationsText: string): string => `
You are an ADHD productivity coach specializing in creating cleaning plans.
Based on the following observations of a messy space:
${observationsText}

Generate a step-by-step cleaning plan optimized for ADHD brains.
The plan should:
1. Start with very easy wins to build momentum.
2. Break down larger tasks into small, manageable micro-tasks.
3. Be encouraging and supportive in tone.
4. Focus on one small area or category at a time to avoid overwhelm.
5. Each task should be a short, clear action statement, ideally fitting on one to two short lines for mobile readability.
6. Aim for around 5-10 tasks. If the area is very messy, focus on the most impactful initial steps.
7. For each task, provide:
    a. "text": The task description (string). This text should be concise.
    b. "estimated_time": A brief time estimate (e.g., "1-2 mins", "Approx. 5 mins") (string).
    c. "difficulty_level": Its difficulty ("easy", "medium", or "hard") (string).
    d. "prioritization_hint": (Optional) A very short hint if applicable (e.g., "Quick win!", "Unblocks other items", "Good for focus") (string).

Provide the plan as a JSON array of objects, where each object contains "text", "estimated_time", "difficulty_level", and optionally "prioritization_hint". Do not include IDs or completion status.

Example:
[
  {
    "text": "Find a trash bag. If you don't have one, use any plastic bag for now.",
    "estimated_time": "1 min",
    "difficulty_level": "easy",
    "prioritization_hint": "Essential first step!"
  },
  {
    "text": "Pick up 3 pieces of visible trash from the floor and put them in the bag.",
    "estimated_time": "2-3 mins",
    "difficulty_level": "easy"
  },
  {
    "text": "Locate one item of clothing on the floor and put it in the laundry hamper (or a designated 'dirty clothes' pile).",
    "estimated_time": "1-2 mins",
    "difficulty_level": "easy",
    "prioritization_hint": "Clears floor space."
  },
  {
    "text": "Clear 5 small items (like wrappers or pens) from your main desk surface.",
    "estimated_time": "3-5 mins",
    "difficulty_level": "medium"
  }
]
`;

/**
 * Generates a prompt for Gemini to create a celebratory message upon task completion.
 *
 * @param {string} taskText The text of the completed task.
 * @returns {string} A formatted prompt string for the AI.
 * This prompt asks the AI to:
 * - Act as an ADHD productivity coach.
 * - Generate a short, positive, and varied celebratory remark for the completed task.
 * - Keep the message natural, encouraging, and avoid complex language.
 * - Respond with only the celebratory message (plain text expected).
 */
export const TASK_COMPLETION_CELEBRATION_PROMPT_TEMPLATE = (taskText: string): string => `
You are an ADHD productivity coach. The user just completed the following task: "${taskText}".
Generate a short (1-2 sentences), positive, and slightly varied celebratory remark related to this completed task.
Keep it natural and encouraging. Avoid overly complex language.

Examples:
- If task was "Pick up 3 pieces of trash": "Awesome, that's 3 less things cluttering the space!" or "Great! Every piece of trash gone makes a difference."
- If task was "Make the bed": "Fantastic, a made bed can make the whole room feel better!" or "Nice one! That's a great step."

Respond with only the celebratory message, no extra text or formatting.
Celebratory message:
`;
