import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class ExecutiveFunctionAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'executive-function',
      name: 'Executive Function Support',
      description: 'Helps with planning, organization, and task initiation',
      category: AgentCategory.TASK_MANAGEMENT,
      capabilities: [
        {
          name: 'task-initiation',
          description: 'Overcomes starting paralysis',
          triggerPhrases: ['can\'t start', 'stuck', 'frozen', 'where to begin']
        },
        {
          name: 'planning-support',
          description: 'Assists with task sequencing'
        }
      ],
      priority: 2,
      isActive: true,
      personality: {
        tone: 'gentle',
        emoji: '🧠'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    const stuckOnStart = context.sessionHistory && 
                        context.sessionHistory.filter(h => h.type === 'task_viewed').length > 5 &&
                        context.completedTasksCount === 0;
    
    const taskInitiationIssue = context.currentTask && 
                               !context.sessionHistory?.some(h => h.type === 'task_started');
    
    return stuckOnStart || taskInitiationIssue;
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const initiationStrategy = this.getInitiationStrategy(context);

    return this.createResponse(
      `${this.config.personality?.emoji} Let's make starting easier!`,
      {
        suggestions: initiationStrategy,
        priority: 'high',
        actionItems: [{
          type: 'suggest',
          payload: {
            technique: 'task-initiation',
            microSteps: this.generateMicroSteps(context.currentTask)
          }
        }]
      }
    );
  }

  private getInitiationStrategy(context: AgentContext): string[] {
    return [
      '🎯 Just touch one item in the area',
      '⏱️ Work for only 2 minutes - you can stop after!',
      '🎵 Put on your favorite song first',
      '📸 Take a "before" photo',
      '🤝 Narrate what you\'re doing out loud'
    ];
  }

  private generateMicroSteps(task: any): string[] {
    if (!task) return [];
    
    return [
      'Stand up',
      'Walk to the area',
      'Pick up ONE thing',
      'Decide: keep, toss, or relocate',
      'Act on that decision',
      'Celebrate that micro-win!'
    ];
  }
}