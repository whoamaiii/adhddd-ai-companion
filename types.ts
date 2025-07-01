
export interface SpatialRelationship {
  relationType: 'on' | 'under' | 'next_to' | 'inside' | 'blocking' | 'scattered_around' | 'stacked_on';
  relatedObject: string;
  description: string;
}

export interface ObjectState {
  condition: 'clean' | 'dirty' | 'cluttered' | 'organized' | 'scattered' | 'stacked' | 'unknown';
  quantity?: number;
  description: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SuggestedTool {
  name: string;
  purpose: string;
  optional: boolean;
}

export interface SpatialContext {
  area: string;
  sequence: number;
  dependencies: string[]; // IDs of tasks that should be completed first
  spatialImpact: 'high' | 'medium' | 'low'; // How much this task improves the space
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prioritizationHint?: string;
  isDeferred?: boolean;
  // Enhanced spatial understanding fields
  spatialContext?: SpatialContext;
  suggestedTools?: SuggestedTool[];
  relatedObjects?: string[];
  locationDescription?: string;
  visualCues?: string;
}

export interface ImageAnalysisObservation {
  description: string; // e.g., "Observation: Scattered clothes on the floor near the bed."
  // Enhanced spatial understanding fields
  object?: string;
  location?: string;
  objectState?: ObjectState;
  spatialRelationships?: SpatialRelationship[];
  boundingBox?: BoundingBox;
  contextualDescription?: string;
  suggestedActions?: string[];
  clusterPriority?: 'hotspot' | 'normal' | 'low_impact';
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
