/**
 * Defines a specific capability of an agent.
 */
export interface AgentCapability {
  /** The unique name of the capability. */
  name: string;
  /** A human-readable description of what the capability does. */
  description: string;
  /** Optional array of phrases that might trigger this capability. */
  triggerPhrases?: string[];
}

/**
 * Represents the response from an agent after analysis.
 */
export interface AgentResponse {
  /** The ID of the agent that generated this response. */
  agentId: string;
  /** The name of the agent. */
  agentName: string;
  /** The primary message or finding from the agent. */
  message: string;
  /** Optional array of suggestions for the user. */
  suggestions?: string[];
  /** The priority of this agent's response. */
  priority?: 'low' | 'medium' | 'high';
  /** Optional array of actionable items proposed by the agent. */
  actionItems?: AgentAction[];
  /** Any additional metadata the agent wants to include. */
  metadata?: Record<string, any>;
}

/**
 * Defines an action that an agent can propose.
 */
export interface AgentAction {
  /** The type of action to be performed. */
  type: 'modify_task' | 'add_task' | 'suggest' | 'motivate' | 'focus' | 'break';
  /** The data payload associated with the action. Structure depends on the action type. */
  payload: any;
}

/**
 * Provides context to agents for their analysis.
 * This includes information about the current state of the application, user, and tasks.
 */
export interface AgentContext {
  /** The currently focused task object. (Type `any` for flexibility, consider defining a `Task` type). */
  currentTask?: any;
  /** An array of all current tasks. (Type `any[]`, consider `Task[]`). */
  allTasks?: any[];
  /** User-specific preferences that might influence agent behavior. */
  userPreferences?: Record<string, any>;
  /** History of relevant events or interactions in the current session. */
  sessionHistory?: any[];
  /** Current time of day (e.g., "morning", "afternoon", "evening"). */
  timeOfDay?: string;
  /** User's self-reported or inferred mood. */
  userMood?: string;
  /** Number of tasks completed in the current session or day. */
  completedTasksCount?: number;
}

/**
 * Categorizes agents based on their general function.
 */
export enum AgentCategory {
  /** Core agents essential for basic functionality. */
  CORE = 'core',
  /** Agents focused on managing tasks. */
  TASK_MANAGEMENT = 'task_management',
  /** Agents focused on user well-being and motivation. */
  WELLNESS = 'wellness',
  /** Agents aimed at enhancing user productivity. */
  PRODUCTIVITY = 'productivity',
  /** Agents providing general support or information. */
  SUPPORT = 'support'
}

/**
 * Configuration for an agent.
 */
export interface AgentConfig {
  /** A unique identifier for the agent. */
  id: string;
  /** The display name of the agent. */
  name: string;
  /** A brief description of the agent's purpose. */
  description: string;
  /** The category the agent belongs to. */
  category: AgentCategory;
  /** An array of capabilities this agent possesses. */
  capabilities: AgentCapability[];
  /** A numerical priority for the agent, influencing its processing order or importance. */
  priority: number;
  /** Whether the agent is currently active and should be considered for analysis. */
  isActive: boolean;
  /** Optional personality traits for the agent, influencing its communication style. */
  personality?: {
    /** The tone of voice the agent should use. */
    tone: 'encouraging' | 'gentle' | 'energetic' | 'calm' | 'playful';
    /** An optional emoji to represent the agent or its current state. */
    emoji?: string;
  };
}

/**
 * Abstract base class for all agents.
 * Defines the common interface and provides shared functionality.
 */
export abstract class BaseAgent {
  /** The configuration object for this agent. */
  protected config: AgentConfig;

  /**
   * Creates an instance of BaseAgent.
   * @param {AgentConfig} config The configuration for this agent.
   */
  constructor(config: AgentConfig) {
    this.config = config;
  }

  /** Gets the agent's unique ID. */
  get id(): string {
    return this.config.id;
  }

  /** Gets the agent's display name. */
  get name(): string {
    return this.config.name;
  }

  /** Gets the agent's category. */
  get category(): AgentCategory {
    return this.config.category;
  }

  /** Checks if the agent is currently active. */
  get isActive(): boolean {
    return this.config.isActive;
  }

  /**
   * Analyzes the given context and returns an agent response.
   * This method must be implemented by concrete agent classes.
   * @param {AgentContext} context The current context for analysis.
   * @returns {Promise<AgentResponse | null>} A promise that resolves to an AgentResponse if the agent has relevant input, or null otherwise.
   */
  abstract analyze(context: AgentContext): Promise<AgentResponse | null>;
  
  /**
   * Determines if the agent can provide help based on the current context.
   * This method must be implemented by concrete agent classes.
   * @param {AgentContext} context The current context to evaluate.
   * @returns {boolean} True if the agent can help, false otherwise.
   */
  abstract canHelp(context: AgentContext): boolean;

  /**
   * Utility method to create a standardized AgentResponse object.
   * @param {string} message The main message for the response.
   * @param {Partial<AgentResponse>} [options] Optional additional properties for the response.
   * @returns {AgentResponse} The constructed agent response.
   */
  protected createResponse(message: string, options?: Partial<AgentResponse>): AgentResponse {
    return {
      agentId: this.config.id,
      agentName: this.config.name,
      message,
      ...options
    };
  }
}