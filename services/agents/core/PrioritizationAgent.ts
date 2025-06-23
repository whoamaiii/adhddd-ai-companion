import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class PrioritizationAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'prioritization',
      name: 'Priority Navigator',
      description: 'Helps decide task order and what to focus on first',
      category: AgentCategory.CORE,
      capabilities: [
        {
          name: 'prioritize',
          description: 'Suggests optimal task order',
          triggerPhrases: ['what first', 'where to start', 'which task', 'priority']
        },
        {
          name: 'decision-support',
          description: 'Helps with task selection paralysis'
        }
      ],
      priority: 1,
      isActive: true,
      personality: {
        tone: 'encouraging',
        emoji: '🎯'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    const hasManyTasks = context.allTasks && context.allTasks.length > 3;
    const atStartOfSession = context.completedTasksCount === 0;
    const indecisive = context.sessionHistory && 
                      context.sessionHistory.filter(h => h.type === 'task_skipped').length > 2;
    
    return hasManyTasks && (atStartOfSession || indecisive);
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const priorityMatrix = this.analyzePriorities(context.allTasks || []);
    const recommendation = this.getTopRecommendation(priorityMatrix, context);

    return this.createResponse(
      `${this.config.personality?.emoji} ${recommendation.message}`,
      {
        suggestions: recommendation.suggestions,
        priority: 'high',
        actionItems: [{
          type: 'suggest',
          payload: {
            recommendedTaskId: recommendation.taskId,
            priorityScores: priorityMatrix
          }
        }]
      }
    );
  }

  private analyzePriorities(tasks: any[]): Map<string, number> {
    const scores = new Map<string, number>();
    
    tasks.forEach(task => {
      let score = 0;
      
      // Quick wins get higher priority
      if (this.isQuickWin(task)) score += 30;
      
      // Visible impact tasks
      if (this.hasVisibleImpact(task)) score += 25;
      
      // Safety/hygiene tasks
      if (this.isSafetyRelated(task)) score += 40;
      
      // Tasks that unlock other tasks
      if (this.isBlocker(task, tasks)) score += 35;
      
      // Energy-appropriate tasks
      if (this.matchesEnergyLevel(task)) score += 20;
      
      scores.set(task.id, score);
    });
    
    return scores;
  }

  private isQuickWin(task: any): boolean {
    const quickKeywords = ['pick up', 'throw away', 'quick', 'small', 'few'];
    return quickKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) ||
      task.description?.toLowerCase().includes(keyword)
    );
  }

  private hasVisibleImpact(task: any): boolean {
    const impactKeywords = ['clear', 'surface', 'floor', 'counter', 'table', 'visible'];
    return impactKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword)
    );
  }

  private isSafetyRelated(task: any): boolean {
    const safetyKeywords = ['spill', 'wet', 'broken', 'hazard', 'block', 'path'];
    return safetyKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword)
    );
  }

  private isBlocker(task: any, allTasks: any[]): boolean {
    // Simple heuristic: tasks mentioning "before" or "first"
    return task.description?.toLowerCase().includes('before') ||
           task.description?.toLowerCase().includes('first');
  }

  private matchesEnergyLevel(task: any): boolean {
    // This would ideally check user's current energy level
    // For now, prefer lighter tasks
    return this.isQuickWin(task);
  }

  private getTopRecommendation(scores: Map<string, number>, context: AgentContext): {
    message: string;
    suggestions: string[];
    taskId: string | null;
  } {
    const sortedTasks = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedTasks.length === 0) {
      return {
        message: 'Start with any task that catches your eye!',
        suggestions: ['🎲 Pick randomly if you\'re stuck', '⏱️ Set a 5-minute timer'],
        taskId: null
      };
    }

    const topTask = context.allTasks?.find(t => t.id === sortedTasks[0][0]);
    const topTaskTitle = topTask?.title || 'the first task';

    return {
      message: `I suggest starting with "${topTaskTitle}" - it's a great choice!`,
      suggestions: [
        '✨ This task will give you a quick win',
        '🚀 It'll build momentum for the next tasks',
        '💡 Trust your gut if you prefer a different task'
      ],
      taskId: sortedTasks[0][0]
    };
  }
}