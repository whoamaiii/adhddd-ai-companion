import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

/**
 * The TaskBreakdownAgent helps users decompose large or overwhelming tasks
 * into smaller, more manageable subtasks.
 */
export class TaskBreakdownAgent extends BaseAgent {
  /**
   * Creates an instance of TaskBreakdownAgent.
   * Initializes the agent with a configuration tailored for task decomposition.
   */
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

  /**
   * Determines if the TaskBreakdownAgent can provide assistance.
   * It checks if there's a current task and if that task is potentially complex,
   * either by its description length or by containing conjunctions suggesting multiple steps.
   * @param {AgentContext} context The current agent context.
   * @returns {boolean} True if the agent can help break down the task, false otherwise.
   */
  canHelp(context: AgentContext): boolean {
    if (!context.currentTask || !context.currentTask.description) return false;
    
    const taskDescription = context.currentTask.description as string;
    // Consider a task complex if its description is long.
    const isLongDescription = taskDescription.length > 50;
    // Consider a task complex if its description contains words that often link multiple actions.
    const containsMultipleActionsKeywords =
      taskDescription.includes(' and ') ||
      taskDescription.includes(', ') || // Commas can separate steps
      taskDescription.includes(' then ');
    
    return isLongDescription || containsMultipleActionsKeywords;
  }

  /**
   * Analyzes the current task and suggests a breakdown into subtasks.
   * If `canHelp` returns true, this method generates subtask suggestions based on keywords in the task description.
   * @param {AgentContext} context The current agent context.
   * @returns {Promise<AgentResponse | null>} An AgentResponse with subtask suggestions, or null if `canHelp` is false or no task description exists.
   */
  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context) || !context.currentTask || !context.currentTask.description) return null;

    const taskDescription = context.currentTask.description as string;
    const subtasks = this.generateSubtasks(taskDescription);

    if (subtasks.length === 0) return null; // No specific subtasks generated

    return this.createResponse(
      `${this.config.personality?.emoji || '🧩'} This task looks like it has multiple parts. Here's how we can break it down:`,
      {
        suggestions: subtasks,
        priority: 'medium',
        actionItems: [{
          type: 'suggest', // Proposes a 'suggest' action containing the subtasks
          payload: { subtasks }
        }]
      }
    );
  }

  /**
   * Generates a list of suggested subtasks based on keywords in the task description.
   * This uses a simple heuristic approach.
   * @private
   * @param {string} description The description of the task to break down.
   * @returns {string[]} An array of suggested subtask strings.
   */
  private generateSubtasks(description: string): string[] {
    const subtasks: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    // Heuristics based on common task types
    if (lowerDesc.includes('clean') || lowerDesc.includes('organize')) {
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