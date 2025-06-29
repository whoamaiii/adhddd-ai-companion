
export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prioritizationHint?: string;
  isDeferred?: boolean;
}

export interface ImageAnalysisObservation {
  description: string; // e.g., "Observation: Scattered clothes on the floor near the bed."
}

export enum AppScreen {
  Home,
  Welcome,
  ImageUpload,
  Processing, // Covers both image analysis and task generation
  Tasks,
  AllTasksCompleted,
  Error,
  // Sensory & Feeling Tracker screens
  LogMoment,
  Timeline,
  Dashboard,
}

// For Gemini responses
export interface GeminiTaskResponseItem {
  text: string;
  estimated_time?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  prioritization_hint?: string;
}

// Sensory & Feeling Tracker types
export interface SensoryMoment {
  id: string;
  timestamp: number;
  behaviors: string[];
  environment: string[];
  overallState: number; // 1-5 from Calm to Overwhelmed
  contextNote?: string;
}
