import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class TaskBreakdownAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'task-breakdown',
      name: 'Task Breakdown Assistant',
      description: 'Helps break down overwhelming tasks into smaller, manageable steps',
      category: AgentCategory.CORE,
      capabilities: [
        {
          name: 'decompose',
          description: 'Breaks complex tasks into subtasks',
          triggerPhrases: ['too hard', 'overwhelming', 'where do I start', 'break it down']
        }
      ],
      priority: 1,
      isActive: true,
      personality: {
        tone: 'gentle',
        emoji: '🧩'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    if (!context.currentTask) return false;
    
    const task = context.currentTask;
    const isComplex = task.description && task.description.length > 50;
    const hasMultipleActions = task.description && (
      task.description.includes(' and ') ||
      task.description.includes(', ') ||
      task.description.includes(' then ')
    );
    
    return isComplex || hasMultipleActions;
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const task = context.currentTask;
    const subtasks = this.generateSubtasks(task.description);

    return this.createResponse(
      `${this.config.personality?.emoji} This task looks like it has multiple parts. Here's how we can break it down:`,
      {
        suggestions: subtasks,
        priority: 'medium',
        actionItems: [{
          type: 'suggest',
          payload: { subtasks }
        }]
      }
    );
  }

  private generateSubtasks(description: string): string[] {
    const subtasks: string[] = [];
    
    if (description.includes('clean') || description.includes('organize')) {
      subtasks.push('🎯 Clear a small 2x2 foot area first');
      subtasks.push('📦 Gather similar items together');
      subtasks.push('🗑️ Remove any obvious trash');
      subtasks.push('✨ Do a final wipe down');
    } else if (description.includes('sort') || description.includes('pile')) {
      subtasks.push('👀 Do a quick visual scan');
      subtasks.push('📑 Create "keep", "toss", and "relocate" piles');
      subtasks.push('⏱️ Set a 5-minute timer for each pile');
      subtasks.push('🎯 Focus on one category at a time');
    } else {
      subtasks.push('🎯 Identify the very first action needed');
      subtasks.push('⏱️ Work for just 5 minutes to start');
      subtasks.push('✅ Complete one small part');
      subtasks.push('🎉 Celebrate the progress!');
    }
    
    return subtasks;
  }
}