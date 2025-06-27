import { BaseAgent, AgentContext, AgentResponse, AgentCategory } from './AgentTypes';

/**
 * Manages a collection of agents, allowing for their registration, activation,
 * and querying for recommendations based on a given context.
 * Agents are individuals or services that can analyze a context and provide suggestions or actions.
 */
export class AgentOrchestrator {
  /** @private {Map<string, BaseAgent>} agents - A map of all registered agents, keyed by their ID. */
  private agents: Map<string, BaseAgent> = new Map();
  /** @private {Set<string>} activeAgents - A set of IDs of agents that are currently active. */
  private activeAgents: Set<string> = new Set();
  /** @private {Map<AgentCategory, BaseAgent[]>} agentsByCategory - Agents grouped by their category. */
  private agentsByCategory: Map<AgentCategory, BaseAgent[]> = new Map();

  /**
   * Initializes the AgentOrchestrator, preparing categories for agent grouping.
   */
  constructor() {
    // Initialize agent category map
    Object.values(AgentCategory).forEach(category => {
      this.agentsByCategory.set(category, []);
    });
  }

  /**
   * Registers an agent with the orchestrator.
   * If the agent is marked as active in its configuration, it's also added to the active set.
   * @param {BaseAgent} agent - The agent instance to register.
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    
    const categoryAgents = this.agentsByCategory.get(agent.category) || [];
    categoryAgents.push(agent);
    this.agentsByCategory.set(agent.category, categoryAgents);
    
    if (agent.isActive) { // Automatically activate if agent's config says so
      this.activeAgents.add(agent.id);
    }
  }

  /**
   * Unregisters an agent from the orchestrator, removing it from all internal collections.
   * @param {string} agentId - The ID of the agent to unregister.
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.activeAgents.delete(agentId); // Remove from active set if present
      
      // Remove from category grouping
      const categoryAgents = this.agentsByCategory.get(agent.category) || [];
      const filtered = categoryAgents.filter(a => a.id !== agentId);
      this.agentsByCategory.set(agent.category, filtered);
    }
  }

  /**
   * Activates a registered agent, allowing it to be considered for recommendations.
   * @param {string} agentId - The ID of the agent to activate.
   */
  activateAgent(agentId: string): void {
    if (this.agents.has(agentId)) { // Ensure agent is registered
      this.activeAgents.add(agentId);
    }
  }

  /**
   * Deactivates an agent, preventing it from being considered for recommendations.
   * @param {string} agentId - The ID of the agent to deactivate.
   */
  deactivateAgent(agentId: string): void {
    this.activeAgents.delete(agentId);
  }

  /**
   * Gathers recommendations from all active agents that can help with the given context.
   * Responses are sorted by priority (high, medium, low).
   * Failed agent analyses are logged and excluded from results.
   * @param {AgentContext} context - The current context to be analyzed by agents.
   * @returns {Promise<AgentResponse[]>} A promise that resolves to an array of agent responses, sorted by priority.
   */
  async getRecommendations(context: AgentContext): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    const activeAgentInstances = Array.from(this.activeAgents)
      .map(id => this.agents.get(id))
      .filter(agent => agent !== undefined) as BaseAgent[];

    const relevantAgents = activeAgentInstances.filter(agent => agent.canHelp(context));
    
    const agentPromises = relevantAgents.map(agent => 
      agent.analyze(context).catch(error => {
        console.error(`Agent ${agent.id} failed:`, error);
        return null;
      })
    );

    const results = await Promise.all(agentPromises);
    
    results.forEach(response => {
      if (response) {
        responses.push(response);
      }
    });

    return responses.sort((a, b) => {
      // Define a numerical order for priority strings
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      // Assign a default priority if not specified, to ensure consistent sorting
      const aPriority = priorityOrder[a.priority || 'medium'] || 0;
      const bPriority = priorityOrder[b.priority || 'medium'] || 0;
      return bPriority - aPriority; // Sort descending by priority value
    });
  }

  /**
   * Retrieves all registered agents belonging to a specific category.
   * @param {AgentCategory} category - The category of agents to retrieve.
   * @returns {Promise<BaseAgent[]>} A promise that resolves to an array of agents in that category. Returns an empty array if the category is not found or has no agents.
   */
  async getAgentsByCategory(category: AgentCategory): Promise<BaseAgent[]> {
    return this.agentsByCategory.get(category) || [];
  }

  /**
   * Retrieves a specific agent by its ID.
   * @param {string} agentId - The ID of the agent to retrieve.
   * @returns {BaseAgent | undefined} The agent instance if found, otherwise undefined.
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Retrieves all registered agents.
   * @returns {BaseAgent[]} An array of all registered agent instances.
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Retrieves all currently active agents.
   * @returns {BaseAgent[]} An array of active agent instances.
   */
  getActiveAgents(): BaseAgent[] {
    return Array.from(this.activeAgents)
      .map(id => this.agents.get(id))
      .filter(agent => agent !== undefined) as BaseAgent[];
  }
}