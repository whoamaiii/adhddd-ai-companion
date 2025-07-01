
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17"; // For text generation and multimodal analysis
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002"; // If specific image generation were needed
export const MAX_FILE_SIZE_MB = 5; // Max image file size in MB

export const INITIAL_ANALYSIS_PROMPT = `
You are an expert at analyzing images of messy rooms with advanced spatial understanding to help someone with ADHD clean.
Given the image, identify key objects, their locations, spatial relationships, and areas of clutter with enhanced detail.

Focus on:
1. Specific object identification with precise locations and spatial relationships
2. Clutter "hotspots" that would have high visual/functional impact if addressed
3. Contextual descriptions that help users locate and prioritize items
4. Visual landmarks and spatial cues for easy navigation

For each observation, provide enhanced spatial context including:
- Object state and condition
- Spatial relationships to other objects/surfaces
- Suggested actions specific to the context
- Visual cues to help locate items

Provide your analysis as a JSON array of objects with enhanced spatial information:
Example output format:
[
  {
    "description": "Scattered clothes on the floor near the bed.",
    "object": "clothes",
    "location": "floor area near the foot of the bed",
    "objectState": {
      "condition": "scattered",
      "quantity": 4,
      "description": "Various clothing items spread across floor"
    },
    "spatialRelationships": [
      {
        "relationType": "scattered_around",
        "relatedObject": "bed",
        "description": "clothes items scattered within 2 feet of bed"
      }
    ],
    "contextualDescription": "Multiple clothing items create a walking hazard near the bed",
    "suggestedActions": ["Pick up each item individually", "Sort into clean/dirty piles"],
    "clusterPriority": "hotspot"
  }
]
`;

export const TASK_GENERATION_PROMPT_TEMPLATE = (observationsText: string): string => `
You are an ADHD productivity coach specializing in creating spatially-aware cleaning plans.
Based on the following spatial analysis of a messy space:
${observationsText}

Generate a step-by-step cleaning plan optimized for ADHD brains with enhanced spatial understanding.
The plan should:
1. Start with very easy wins to build momentum.
2. Break down larger tasks into small, manageable micro-tasks with precise spatial guidance.
3. Be encouraging and supportive in tone.
4. Focus on one small area or category at a time to avoid overwhelm.
5. Use spatial relationships to sequence tasks efficiently.
6. Include tool recommendations based on object types and locations.
7. Provide visual cues and landmarks for easy task location.
8. Each task should be a short, clear action statement with spatial context.
9. Aim for around 5-10 tasks. If the area is very messy, focus on the most impactful initial steps.

For each task, provide enhanced spatial information:
    a. "text": The task description with spatial context (string).
    b. "estimated_time": A brief time estimate (string).
    c. "difficulty_level": Its difficulty ("easy", "medium", or "hard") (string).
    d. "prioritization_hint": (Optional) A very short hint (string).
    e. "spatialContext": Object with area, sequence, dependencies, and spatial impact.
    f. "suggestedTools": Array of tools needed for this specific task.
    g. "relatedObjects": Array of objects involved in the task.
    h. "locationDescription": Precise location for easy finding.
    i. "visualCues": Visual landmarks to help locate the task area.

Example with spatial enhancements:
[
  {
    "text": "Find a trash bag from under the kitchen sink.",
    "estimated_time": "1 min",
    "difficulty_level": "easy",
    "prioritization_hint": "Essential first step!",
    "spatialContext": {
      "area": "kitchen",
      "sequence": 1,
      "dependencies": [],
      "spatialImpact": "high"
    },
    "suggestedTools": [],
    "relatedObjects": ["trash bag", "kitchen sink"],
    "locationDescription": "Cabinet under the kitchen sink, left side",
    "visualCues": "Look for the cabinet handles below the sink faucet"
  },
  {
    "text": "Pick up the 3 candy wrappers from the coffee table surface.",
    "estimated_time": "1 min",
    "difficulty_level": "easy",
    "prioritization_hint": "Quick visual win!",
    "spatialContext": {
      "area": "living room",
      "sequence": 1,
      "dependencies": ["task-1"],
      "spatialImpact": "medium"
    },
    "suggestedTools": [
      {
        "name": "trash bag",
        "purpose": "collect wrappers",
        "optional": false
      }
    ],
    "relatedObjects": ["candy wrappers", "coffee table"],
    "locationDescription": "Center of the coffee table, next to the remote control",
    "visualCues": "Look for the colorful wrappers near the TV remote"
  }
]
`;

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

export const COMPLETION_SUMMARY_PROMPT_TEMPLATE = (completedTasksData: string): string => `
You are an ADHD productivity coach celebrating a user's accomplishment of completing ALL their cleaning tasks.
The user just finished this complete list of tasks:
${completedTasksData}

Generate a personalized, enthusiastic celebration message (2-3 sentences) that:
1. Acknowledges the specific types of tasks they conquered (mention 1-2 specific examples)
2. Highlights the effort and persistence required for someone with ADHD
3. Makes them feel genuinely proud of their accomplishment
4. Uses warm, encouraging language that avoids being overly clinical

Examples:
- "You just conquered organizing that cluttered desk AND sorting through all those scattered papers - that takes serious focus and determination! The way you pushed through each task one by one shows incredible persistence."
- "Amazing work tackling both the kitchen cleanup and that pile of laundry - those are exactly the kinds of tasks that can feel overwhelming, but you powered through every single one!"

Focus on their effort and specific accomplishments. Respond with only the celebration message, no extra formatting.
Celebration message:
`;

export const SENSORY_INSIGHT_PROMPT_TEMPLATE = (momentsData: string): string => `
You are an empathetic data analyst specializing in sensory experiences and emotional states.
Analyze the following logged sensory data:
${momentsData}

Your goal is to identify patterns, correlations, and potential triggers that might be influencing the user's overall state.
Look for connections between:
- Specific behaviors and their impact on overall state.
- Environmental triggers and their correlation with certain states or behaviors.
- Time of day or day of week patterns.

Generate a short (1-3 sentences), supportive, and insightful summary of your findings.
The summary should be encouraging and actionable, helping the user understand their patterns better.

Example Insight: "I notice that 'Loud Noises' and 'Crowded' environments often appear on days you feel most overwhelmed. Perhaps try to find quieter spaces during those times if possible."

Provide only the insight summary as plain text.
`;
