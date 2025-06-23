import { BaseAgent, AgentContext, AgentResponse, AgentCategory } from './AgentTypes';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private activeAgents: Set<string> = new Set();
  private agentsByCategory: Map<AgentCategory, BaseAgent[]> = new Map();

  constructor() {
    Object.values(AgentCategory).forEach(category => {
      this.agentsByCategory.set(category, []);
    });
  }

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    
    const categoryAgents = this.agentsByCategory.get(agent.category) || [];
    categoryAgents.push(agent);
    this.agentsByCategory.set(agent.category, categoryAgents);
    
    if (agent.isActive) {
      this.activeAgents.add(agent.id);
    }
  }

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

  activateAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      this.activeAgents.add(agentId);
    }
  }

  deactivateAgent(agentId: string): void {
    this.activeAgents.delete(agentId);
  }

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
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    });
  }

  async getAgentsByCategory(category: AgentCategory): Promise<BaseAgent[]> {
    return this.agentsByCategory.get(category) || [];
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): BaseAgent[] {
    return Array.from(this.activeAgents)
      .map(id => this.agents.get(id))
      .filter(agent => agent !== undefined) as BaseAgent[];
  }
}