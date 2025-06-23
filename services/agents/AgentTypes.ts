export interface AgentCapability {
  name: string;
  description: string;
  triggerPhrases?: string[];
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  message: string;
  suggestions?: string[];
  priority?: 'low' | 'medium' | 'high';
  actionItems?: AgentAction[];
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: 'modify_task' | 'add_task' | 'suggest' | 'motivate' | 'focus' | 'break';
  payload: any;
}

export interface AgentContext {
  currentTask?: any;
  allTasks?: any[];
  userPreferences?: Record<string, any>;
  sessionHistory?: any[];
  timeOfDay?: string;
  userMood?: string;
  completedTasksCount?: number;
}

export enum AgentCategory {
  CORE = 'core',
  TASK_MANAGEMENT = 'task_management',
  WELLNESS = 'wellness',
  PRODUCTIVITY = 'productivity',
  SUPPORT = 'support'
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  capabilities: AgentCapability[];
  priority: number;
  isActive: boolean;
  personality?: {
    tone: 'encouraging' | 'gentle' | 'energetic' | 'calm' | 'playful';
    emoji?: string;
  };
}

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get category(): AgentCategory {
    return this.config.category;
  }

  get isActive(): boolean {
    return this.config.isActive;
  }

  abstract analyze(context: AgentContext): Promise<AgentResponse | null>;
  
  abstract canHelp(context: AgentContext): boolean;

  protected createResponse(message: string, options?: Partial<AgentResponse>): AgentResponse {
    return {
      agentId: this.config.id,
      agentName: this.config.name,
      message,
      ...options
    };
  }
}