import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

/**
 * The FocusAgent helps users maintain attention and prevent overwhelm,
 * especially when dealing with multiple tasks or long sessions.
 */
export class FocusAgent extends BaseAgent {
  /**
   * Creates an instance of FocusAgent.
   * Initializes the agent with a specific configuration for focus-related assistance.
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
   * Determines if the FocusAgent can provide assistance based on the current context.
   * It checks for conditions like having a current task, a large number of total tasks,
   * a long session history, or frequent task switching.
   * @param {AgentContext} context The current agent context.
   * @returns {boolean} True if the agent can help, false otherwise.
   */
  canHelp(context: AgentContext): boolean {
    if (!context.currentTask) return false;
    
    // Trigger if there are many tasks, suggesting potential for overwhelm.
    const hasMultipleTasks = context.allTasks && context.allTasks.length > 5;
    // Trigger if the session has been long, indicating potential fatigue or loss of focus.
    const longSession = context.sessionHistory && context.sessionHistory.length > 10; // Example: 10 actions taken
    // Trigger if the user has been switching between tasks frequently.
    const switchedTasks = this.detectTaskSwitching(context);
    
    return hasMultipleTasks || longSession || switchedTasks;
  }

  /**
   * Analyzes the context and provides focus-related recommendations.
   * If `canHelp` returns true, this method generates tips and suggests a focus technique.
   * @param {AgentContext} context The current agent context.
   * @returns {Promise<AgentResponse | null>} An AgentResponse with focus suggestions, or null if `canHelp` is false.
   */
  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const focusTips = this.generateFocusTips(context);
    const currentTaskReminder = context.currentTask && context.currentTask.title ?
      `Your current task: "${context.currentTask.title}"` :
      'Let\'s focus on what needs doing.';


    return this.createResponse(
      `${this.config.personality?.emoji || '🎯'} ${currentTaskReminder}`,
      {
        suggestions: focusTips,
        priority: 'high',
        actionItems: [{
          type: 'focus', // Proposes a 'focus' action
          payload: {
            technique: this.selectFocusTechnique(context),
            duration: 300 // Suggests a 5-minute focus period (in seconds)
          }
        }]
      }
    );
  }

  /**
   * Generates a list of focus tips based on the current context.
   * @private
   * @param {AgentContext} context The current agent context.
   * @returns {string[]} An array of focus tip strings.
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
   * Detects if the user has been frequently switching tasks.
   * This is based on the number of 'task_viewed' or 'task_selected' actions
   * in the recent session history.
   * @private
   * @param {AgentContext} context The current agent context.
   * @returns {boolean} True if frequent task switching is detected, false otherwise.
   */
  private detectTaskSwitching(context: AgentContext): boolean {
    if (!context.sessionHistory || context.sessionHistory.length < 3) return false;
    
    // Look at the last 5 actions in the session history.
    const recentActions = context.sessionHistory.slice(-5);
    // Count how many of these actions are related to viewing or selecting tasks.
    const taskChanges = recentActions.filter(action => 
      action.type === 'task_viewed' || action.type === 'task_selected' // Assuming these action types exist
    );
    
    // If there are 3 or more such actions in the last 5, consider it task switching.
    return taskChanges.length >= 3;
  }

  /**
   * Selects a focus technique based on the current context (e.g., time of day, user mood, task load).
   * @private
   * @param {AgentContext} context The current agent context.
   * @returns {string} The name of the selected focus technique.
   */
  private selectFocusTechnique(context: AgentContext): string {
    const techniques = [
      'pomodoro', // Standard Pomodoro Technique
      'time-boxing', // Allocating fixed time periods to tasks
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