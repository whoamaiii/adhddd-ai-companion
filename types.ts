
export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prioritizationHint?: string;
}

export interface ImageAnalysisObservation {
  description: string; // e.g., "Observation: Scattered clothes on the floor near the bed."
}

export enum AppScreen {
  Welcome,
  ImageUpload,
  Processing, // Covers both image analysis and task generation
  Tasks,
  AllTasksCompleted,
  Error,
}

// For Gemini responses
export interface GeminiTaskResponseItem {
  text: string;
  estimated_time?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  prioritization_hint?: string;
}