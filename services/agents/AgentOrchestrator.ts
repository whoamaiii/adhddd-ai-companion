import { BaseAgent, AgentContext, AgentResponse, AgentCategory } from './AgentTypes';

/**
 * Manages the lifecycle and execution of various AI agents.
 * This class is responsible for registering, unregistering, activating, and deactivating agents.
 * It orchestrates agents to get recommendations based on a given context and organizes them by category.
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private activeAgents: Set<string> = new Set();
  private agentsByCategory: Map<AgentCategory, BaseAgent[]> = new Map();

  /**
   * Initializes the orchestrator by setting up category buckets for agents.
   */
  constructor() {
    Object.values(AgentCategory).forEach(category => {
      this.agentsByCategory.set(category, []);
    });
  }

  /**
   * Registers a new agent with the orchestrator.
   * @param agent The agent instance to register.
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    
    const categoryAgents = this.agentsByCategory.get(agent.category) || [];
    categoryAgents.push(agent);
    this.agentsByCategory.set(agent.category, categoryAgents);
    
    if (agent.isActive) {
      this.activeAgents.add(agent.id);
    }
  }

  /**
   * Unregisters an agent from the orchestrator.
   * @param agentId The unique identifier of the agent to unregister.
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.activeAgents.delete(agentId);
      
      const categoryAgents = this.agentsByCategory.get(agent.category) || [];
      const filtered = categoryAgents.filter(a => a.id !== agentId);
      this.agentsByCategory.set(agent.category, filtered);
    }
  }

  /**
   * Activates a registered agent, allowing it to provide recommendations.
   * @param agentId The unique identifier of the agent to activate.
   */
  activateAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      this.activeAgents.add(agentId);
    }
  }

  /**
   * Deactivates an agent, preventing it from providing recommendations.
   * @param agentId The unique identifier of the agent to deactivate.
   */
  deactivateAgent(agentId: string): void {
    this.activeAgents.delete(agentId);
  }

  /**
   * Gathers and returns recommendations from all active and relevant agents.
   * @param context The current context (e.g., user state, environment) to be analyzed by the agents.
   * @returns A promise that resolves to an array of agent responses, sorted by priority.
   */
  async getRecommendations(context: AgentContext): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    const activeAgentInstances = Array.from(this.activeAgents)
      .map(id => this.agents.get(id))
      .filter((agent): agent is BaseAgent => agent !== undefined);

    // Filter for agents that can help with the given context
    const relevantAgents = activeAgentInstances.filter(agent => agent.canHelp(context));
    
    // Execute analysis for all relevant agents in parallel
    const agentPromises = relevantAgents.map(agent =>
      agent.analyze(context).catch(error => {
        console.error(`Agent ${agent.id} failed:`, error);
        return null; // Return null on failure to not break the Promise.all
      })
    );

    const results = await Promise.all(agentPromises);
    
    // Collect valid responses
    results.forEach(response => {
      if (response) {
        responses.push(response);
      }
    });

    // Sort responses by priority (high, medium, low)
    return responses.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    });
  }

  /**
   * Retrieves all registered agents belonging to a specific category.
   * @param category The category of agents to retrieve.
   * @returns A promise that resolves to an array of agents in the specified category.
   */
  async getAgentsByCategory(category: AgentCategory): Promise<BaseAgent[]> {
    return this.agentsByCategory.get(category) || [];
  }

  /**
   * Retrieves a single agent by its unique identifier.
   * @param agentId The ID of the agent to retrieve.
   * @returns The agent instance, or undefined if not found.
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Retrieves all registered agents.
   * @returns An array of all agent instances.
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Retrieves all currently active agents.
   * @returns An array of active agent instances.
   */
  getActiveAgents(): BaseAgent[] {
    return Array.from(this.activeAgents)
      .map(id => this.agents.get(id))
      .filter((agent): agent is BaseAgent => agent !== undefined);
  }
}