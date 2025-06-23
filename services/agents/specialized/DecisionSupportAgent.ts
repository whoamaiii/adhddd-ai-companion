import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class DecisionSupportAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'decision-support',
      name: 'Decision Helper',
      description: 'Simplifies decision-making and reduces analysis paralysis',
      category: AgentCategory.TASK_MANAGEMENT,
      capabilities: [
        {
          name: 'simplify-choices',
          description: 'Reduces decision complexity',
          triggerPhrases: ['can\'t decide', 'not sure', 'what should I', 'keep or toss']
        },
        {
          name: 'quick-decision',
          description: 'Provides decision frameworks'
        }
      ],
      priority: 2,
      isActive: true,
      personality: {
        tone: 'encouraging',
        emoji: '🤔'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    const hasDecisionWords = context.currentTask && (
      context.currentTask.title.includes('sort') ||
      context.currentTask.title.includes('organize') ||
      context.currentTask.title.includes('decide')
    );
    
    const stuckPattern = context.sessionHistory &&
                        context.sessionHistory.filter(h => 
                          h.type === 'task_viewed' && h.taskId === context.currentTask?.id
                        ).length > 3;
    
    return hasDecisionWords || stuckPattern;
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const decisionFramework = this.getDecisionFramework(context);
    const quickRules = this.getQuickDecisionRules(context);

    return this.createResponse(
      `${this.config.personality?.emoji} Let's make decisions easier!`,
      {
        suggestions: [...decisionFramework, ...quickRules],
        priority: 'high',
        actionItems: [{
          type: 'suggest',
          payload: {
            technique: 'quick-decision',
            rules: quickRules
          }
        }]
      }
    );
  }

  private getDecisionFramework(context: AgentContext): string[] {
    const taskType = this.detectTaskType(context.currentTask);
    
    if (taskType === 'declutter') {
      return [
        '🎯 One Touch Rule: Make a decision the first time you touch it',
        '⏰ 5-Second Rule: If you can\'t decide in 5 seconds, it goes',
        '❓ Ask: "Have I used this in the last year?"'
      ];
    } else if (taskType === 'organize') {
      return [
        '📦 Group similar items together first',
        '👀 Keep frequently used items accessible',
        '🏷️ Label everything to avoid future decisions'
      ];
    }
    
    return [
      '✨ When in doubt, simplify',
      '🎲 It\'s okay to decide quickly - you can adjust later',
      '💡 Trust your first instinct'
    ];
  }

  private getQuickDecisionRules(context: AgentContext): string[] {
    return [
      '🚮 If it\'s broken or expired → Toss',
      '💝 If it brings joy or serves a purpose → Keep',
      '🤷 If you\'re unsure → Put in a "maybe" box for 1 month',
      '👥 If it belongs to someone else → Return it'
    ];
  }

  private detectTaskType(task: any): string {
    if (!task) return 'general';
    
    const title = task.title.toLowerCase();
    if (title.includes('declutter') || title.includes('sort')) return 'declutter';
    if (title.includes('organize') || title.includes('arrange')) return 'organize';
    
    return 'general';
  }
}