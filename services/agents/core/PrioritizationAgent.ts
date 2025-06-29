import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

/**
 * The PrioritizationAgent helps users decide which tasks to focus on first.
 * It analyzes tasks based on factors like potential for a quick win, visible impact,
 * and safety concerns to suggest an optimal starting point.
 */
export class PrioritizationAgent extends BaseAgent {
  /**
   * Creates an instance of PrioritizationAgent.
   */
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

  /**
   * Determines if the agent can provide help based on the number of tasks and user behavior.
   * @param context The current agent context.
   * @returns True if the agent can help, otherwise false.
   */
  canHelp(context: AgentContext): boolean {
    const hasManyTasks = context.allTasks && context.allTasks.length > 3;
    const atStartOfSession = context.completedTasksCount === 0;
    const indecisive = context.sessionHistory &&
                      context.sessionHistory.filter(h => h.type === 'task_skipped').length > 2;
    
    return !!(hasManyTasks && (atStartOfSession || indecisive));
  }

  /**
   * Analyzes tasks to create a priority matrix and offers a top recommendation.
   * @param context The current agent context.
   * @returns An AgentResponse with a suggested task, or null if it can't help.
   */
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

  /**
   * Scores tasks based on a set of heuristics.
   * @param tasks An array of tasks to analyze.
   * @returns A map of task IDs to their priority scores.
   */
  private analyzePriorities(tasks: any[]): Map<string, number> {
    const scores = new Map<string, number>();
    
    tasks.forEach(task => {
      let score = 0;
      
      if (this.isQuickWin(task)) score += 30;
      if (this.hasVisibleImpact(task)) score += 25;
      if (this.isSafetyRelated(task)) score += 40;
      if (this.isBlocker(task, tasks)) score += 35;
      if (this.matchesEnergyLevel(task)) score += 20;
      
      scores.set(task.id, score);
    });
    
    return scores;
  }

  /**
   * Checks if a task is a "quick win" based on keywords.
   * @param task The task to check.
   * @returns True if the task is a quick win, otherwise false.
   */
  private isQuickWin(task: any): boolean {
    const quickKeywords = ['pick up', 'throw away', 'quick', 'small', 'few'];
    return quickKeywords.some(keyword =>
      task.title.toLowerCase().includes(keyword) ||
      (task.description && task.description.toLowerCase().includes(keyword))
    );
  }

  /**
   * Checks if a task will have a high visible impact.
   * @param task The task to check.
   * @returns True if the task has high visible impact, otherwise false.
   */
  private hasVisibleImpact(task: any): boolean {
    const impactKeywords = ['clear', 'surface', 'floor', 'counter', 'table', 'visible'];
    return impactKeywords.some(keyword =>
      task.title.toLowerCase().includes(keyword)
    );
  }

  /**
   * Checks if a task is related to safety or hygiene.
   * @param task The task to check.
   * @returns True if the task is safety-related, otherwise false.
   */
  private isSafetyRelated(task: any): boolean {
    const safetyKeywords = ['spill', 'wet', 'broken', 'hazard', 'block', 'path'];
    return safetyKeywords.some(keyword =>
      task.title.toLowerCase().includes(keyword)
    );
  }

  /**
   * Checks if a task is a blocker for other tasks.
   * @param task The task to check.
   * @param allTasks The list of all tasks.
   * @returns True if the task is a blocker, otherwise false.
   */
  private isBlocker(task: any, allTasks: any[]): boolean {
    return (task.description && (task.description.toLowerCase().includes('before') ||
           task.description.toLowerCase().includes('first')));
  }

  /**
   * Checks if a task matches the user's current energy level (heuristic).
   * @param task The task to check.
   * @returns True if the task is a good match for the energy level.
   */
  private matchesEnergyLevel(task: any): boolean {
    return this.isQuickWin(task);
  }

  /**
   * Generates the top recommendation based on priority scores.
   * @param scores A map of task IDs to their scores.
   * @param context The current agent context.
   * @returns An object with the recommendation message, suggestions, and task ID.
   */
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
        '🚀 It\'ll build momentum for the next tasks',
        '💡 Trust your gut if you prefer a different task'
      ],
      taskId: sortedTasks[0][0]
    };
  }
}