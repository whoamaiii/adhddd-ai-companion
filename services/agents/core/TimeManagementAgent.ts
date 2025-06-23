import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class TimeManagementAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'time-management',
      name: 'Time Estimation Expert',
      description: 'Helps estimate task duration and manage time effectively',
      category: AgentCategory.CORE,
      capabilities: [
        {
          name: 'estimate',
          description: 'Provides realistic time estimates',
          triggerPhrases: ['how long', 'time estimate', 'duration', 'quick task']
        },
        {
          name: 'pace',
          description: 'Helps maintain sustainable pace'
        }
      ],
      priority: 1,
      isActive: true,
      personality: {
        tone: 'gentle',
        emoji: '⏰'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    if (!context.currentTask) return false;
    
    const needsTimeEstimate = !context.currentTask.estimatedDuration;
    const longSession = context.sessionHistory && 
                       context.sessionHistory.filter(h => h.type === 'task_completed').length > 5;
    
    return needsTimeEstimate || longSession;
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const task = context.currentTask;
    const estimate = this.estimateTaskDuration(task);
    const paceAdvice = this.getPaceAdvice(context);

    return this.createResponse(
      `${this.config.personality?.emoji} This task will likely take ${estimate.display}`,
      {
        suggestions: [
          `⏱️ Set a timer for ${estimate.timerMinutes} minutes`,
          `🎯 Break it into ${estimate.chunks} mini-sessions if needed`,
          ...paceAdvice
        ],
        priority: 'medium',
        actionItems: [{
          type: 'suggest',
          payload: {
            estimatedDuration: estimate.minutes,
            timerDuration: estimate.timerMinutes,
            technique: 'time-boxing'
          }
        }],
        metadata: {
          adhd_time_multiplier: 1.5,
          buffer_included: true
        }
      }
    );
  }

  private estimateTaskDuration(task: any): {
    minutes: number;
    timerMinutes: number;
    display: string;
    chunks: number;
  } {
    const baseEstimates: Record<string, number> = {
      'sort': 10,
      'clean': 15,
      'organize': 20,
      'wipe': 5,
      'pick up': 5,
      'throw away': 3,
      'vacuum': 10,
      'dust': 8,
      'declutter': 25
    };

    let estimatedMinutes = 15; // default
    
    const taskLower = task.title.toLowerCase();
    for (const [key, minutes] of Object.entries(baseEstimates)) {
      if (taskLower.includes(key)) {
        estimatedMinutes = minutes;
        break;
      }
    }

    // ADHD time multiplier - tasks often take longer
    const adjustedMinutes = Math.ceil(estimatedMinutes * 1.5);
    
    // Timer should be shorter to maintain focus
    const timerMinutes = Math.min(adjustedMinutes, 15);
    
    // Calculate chunks
    const chunks = Math.ceil(adjustedMinutes / 15);

    return {
      minutes: adjustedMinutes,
      timerMinutes,
      display: this.formatDuration(adjustedMinutes),
      chunks
    };
  }

  private formatDuration(minutes: number): string {
    if (minutes < 10) return 'about 5-10 minutes';
    if (minutes <= 15) return 'about 15 minutes';
    if (minutes <= 30) return '20-30 minutes';
    if (minutes <= 45) return '30-45 minutes';
    return 'about an hour (with breaks)';
  }

  private getPaceAdvice(context: AgentContext): string[] {
    const advice: string[] = [];
    const completedCount = context.completedTasksCount || 0;

    if (completedCount > 5) {
      advice.push('🌟 You\'ve been working hard! Consider a 10-minute break');
    }

    if (context.timeOfDay === 'evening') {
      advice.push('🌙 Evening energy tip: Tackle easier tasks now');
    } else if (context.timeOfDay === 'morning') {
      advice.push('☀️ Morning focus is great for complex tasks');
    }

    if (context.userMood === 'tired') {
      advice.push('💤 Feeling tired? This might take a bit longer - that\'s okay!');
    }

    return advice;
  }
}