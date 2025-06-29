import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

/**
 * The FocusAgent helps users maintain attention and avoid overwhelm.
 * It detects signs of distraction, such as task switching or a large number of tasks,
 * and provides gentle reminders and actionable focus techniques.
 */
export class FocusAgent extends BaseAgent {
  /**
   * Creates an instance of FocusAgent.
   */
  constructor() {
    const config: AgentConfig = {
      id: 'focus',
      name: 'Focus Guardian',
      description: 'Helps maintain attention and prevent overwhelm',
      category: AgentCategory.CORE,
      capabilities: [
        {
          name: 'refocus',
          description: 'Brings attention back to current task',
          triggerPhrases: ['distracted', 'can\'t focus', 'lost track', 'what was I doing']
        },
        {
          name: 'simplify',
          description: 'Reduces cognitive load'
        }
      ],
      priority: 1,
      isActive: true,
      personality: {
        tone: 'calm',
        emoji: '🎯'
      }
    };
    super(config);
  }

  /**
   * Determines if the agent can provide help based on the current context.
   * It checks for a high number of tasks, long sessions, or frequent task switching.
   * @param context The current agent context.
   * @returns True if the agent can help, otherwise false.
   */
  canHelp(context: AgentContext): boolean {
    if (!context.currentTask) return false;
    
    const hasMultipleTasks = context.allTasks && context.allTasks.length > 5;
    const longSession = context.sessionHistory && context.sessionHistory.length > 10;
    const switchedTasks = this.detectTaskSwitching(context);
    
    return hasMultipleTasks || longSession || switchedTasks;
  }

  /**
   * Analyzes the context and generates a response with focus tips and actions.
   * @param context The current agent context.
   * @returns An AgentResponse with suggestions, or null if it can't help.
   */
  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const focusTips = this.generateFocusTips(context);
    const currentTaskReminder = context.currentTask ?
      `Your current task: "${context.currentTask.title}"` : '';

    return this.createResponse(
      `${this.config.personality?.emoji} ${currentTaskReminder}`,
      {
        suggestions: focusTips,
        priority: 'high',
        actionItems: [{
          type: 'focus',
          payload: {
            technique: this.selectFocusTechnique(context),
            duration: 300 // 5 minutes in seconds
          }
        }]
      }
    );
  }

  /**
   * Generates a list of context-aware focus tips.
   * @param context The current agent context.
   * @returns An array of strings with focus tips.
   */
  private generateFocusTips(context: AgentContext): string[] {
    const tips: string[] = [];
    
    if (context.allTasks && context.allTasks.length > 5) {
      tips.push('🧘 Hide other tasks - focus only on this one');
      tips.push('⏰ Set a 5-minute timer');
      tips.push('🎧 Consider using white noise or focus music');
    }
    
    if (this.detectTaskSwitching(context)) {
      tips.push('🛑 Pause and take 3 deep breaths');
      tips.push('📝 Write down distracting thoughts to handle later');
      tips.push('🎯 Remember: One task at a time');
    }
    
    tips.push('💧 Take a sip of water');
    tips.push('🪟 Minimize other windows/apps');
    
    return tips;
  }

  /**
   * Detects if the user has been switching between tasks frequently.
   * @param context The current agent context.
   * @returns True if frequent task switching is detected, otherwise false.
   */
  private detectTaskSwitching(context: AgentContext): boolean {
    if (!context.sessionHistory || context.sessionHistory.length < 3) return false;
    
    const recentActions = context.sessionHistory.slice(-5);
    const taskChanges = recentActions.filter(action =>
      action.type === 'task_viewed' || action.type === 'task_selected'
    );
    
    return taskChanges.length >= 3;
  }

  /**
   * Selects an appropriate focus technique based on the context.
   * @param context The current agent context.
   * @returns The name of a focus technique as a string.
   */
  private selectFocusTechnique(context: AgentContext): string {
    const techniques = [
      'pomodoro',
      'time-boxing',
      'single-tasking',
      'mindful-breathing',
      'body-scan'
    ];
    
    if (context.timeOfDay === 'morning') {
      return 'pomodoro';
    } else if (context.userMood === 'tired') {
      return 'mindful-breathing';
    } else if (context.allTasks && context.allTasks.length > 10) {
      return 'time-boxing';
    }
    
    return 'single-tasking';
  }
}