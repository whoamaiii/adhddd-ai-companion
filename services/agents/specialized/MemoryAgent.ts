import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class MemoryAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'memory',
      name: 'Memory Assistant',
      description: 'Provides reminders and helps track important information',
      category: AgentCategory.TASK_MANAGEMENT,
      capabilities: [
        {
          name: 'remember',
          description: 'Tracks important task details',
          triggerPhrases: ['remind me', 'don\'t forget', 'remember', 'where did I put']
        },
        {
          name: 'context-recall',
          description: 'Recalls previous decisions and progress'
        }
      ],
      priority: 2,
      isActive: true,
      personality: {
        tone: 'gentle',
        emoji: '📝'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    const hasSkippedTasks = context.sessionHistory &&
                           context.sessionHistory.some(h => h.type === 'task_skipped');
    
    const returningToTask = context.sessionHistory &&
                           context.sessionHistory.filter(h => 
                             h.taskId === context.currentTask?.id
                           ).length > 1;
    
    return Boolean(hasSkippedTasks || returningToTask);
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const reminders = this.generateReminders(context);
    const contextInfo = this.recallContext(context);

    return this.createResponse(
      `${this.config.personality?.emoji} Here's what to remember:`,
      {
        suggestions: [...reminders, ...contextInfo],
        priority: 'medium',
        actionItems: [{
          type: 'suggest',
          payload: {
            memoryAids: this.suggestMemoryAids(context)
          }
        }]
      }
    );
  }

  private generateReminders(context: AgentContext): string[] {
    const reminders: string[] = [];
    
    if (context.currentTask?.description?.includes('sort')) {
      reminders.push('💭 Remember your sorting categories: Keep, Toss, Relocate');
    }
    
    if (context.sessionHistory?.some(h => h.type === 'task_skipped')) {
      reminders.push('📌 You have some skipped tasks to return to later');
    }
    
    reminders.push('🎯 Focus on just this one task right now');
    
    return reminders;
  }

  private recallContext(context: AgentContext): string[] {
    const contextInfo: string[] = [];
    
    if (context.completedTasksCount && context.completedTasksCount > 0) {
      contextInfo.push(`✅ You've already completed ${context.completedTasksCount} tasks!`);
    }
    
    if (context.currentTask?.metadata?.previousAttempts) {
      contextInfo.push('🔄 You have worked on this before - you can do it!');
    }
    
    return contextInfo;
  }

  private suggestMemoryAids(context: AgentContext): string[] {
    return [
      'Take a photo of sorted items',
      'Use voice notes for important decisions',
      'Place items in labeled containers',
      'Create a simple checklist'
    ];
  }
}
