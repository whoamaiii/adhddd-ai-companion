import { Task } from '../types/Task';

// Voice command interface
export interface VoiceCommand {
  id: string;
  patterns: string[];
  action: string;
  category: 'task' | 'navigation' | 'query' | 'bodyDouble' | 'settings';
  parameters?: {
    [key: string]: 'string' | 'number' | 'boolean';
  };
  description: string;
  examples: string[];
}

// Command match result with confidence scoring
export interface CommandMatch {
  command: VoiceCommand;
  confidence: number;
  parameters?: { [key: string]: any };
  matchedPattern: string;
  originalInput: string;
}

// Comprehensive voice commands for ADHD users
export const voiceCommands: VoiceCommand[] = [
  // Task Management Commands
  {
    id: 'complete-task',
    patterns: [
      'complete task',
      'mark done',
      'finish task',
      'done with this',
      'completed',
      'check off',
      'cross out',
      'i did it',
      'finished',
      'task done',
      'all done'
    ],
    action: 'COMPLETE_CURRENT_TASK',
    category: 'task',
    description: 'Mark the current task as completed',
    examples: ['complete task', 'done with this', 'finished']
  },
  {
    id: 'next-task',
    patterns: [
      'next task',
      'whats next',
      'next one',
      'move on',
      'skip to next',
      'go forward',
      'next please',
      'continue',
      'keep going'
    ],
    action: 'NEXT_TASK',
    category: 'task',
    description: 'Move to the next task in the list',
    examples: ['next task', 'whats next', 'move on']
  },
  {
    id: 'previous-task',
    patterns: [
      'previous task',
      'go back',
      'last task',
      'back one',
      'previous one',
      'go backward',
      'back up',
      'earlier task'
    ],
    action: 'PREVIOUS_TASK',
    category: 'task',
    description: 'Go back to the previous task',
    examples: ['previous task', 'go back', 'last task']
  },
  {
    id: 'skip-task',
    patterns: [
      'skip task',
      'skip this',
      'pass on this',
      'come back later',
      'not now',
      'skip it',
      'maybe later',
      'cant do this now'
    ],
    action: 'SKIP_TASK',
    category: 'task',
    description: 'Skip the current task and move to the next',
    examples: ['skip task', 'not now', 'come back later']
  },
  {
    id: 'add-task',
    patterns: [
      'add task',
      'new task',
      'create task',
      'add to list',
      'remember to',
      'dont forget',
      'i need to',
      'put on list'
    ],
    action: 'ADD_TASK',
    category: 'task',
    parameters: {
      taskTitle: 'string'
    },
    description: 'Add a new task to the list',
    examples: ['add task clean room', 'remember to call mom', 'i need to buy groceries']
  },
  {
    id: 'remove-task',
    patterns: [
      'remove task',
      'delete task',
      'take off list',
      'remove this',
      'delete this',
      'dont need this',
      'cancel task',
      'forget this'
    ],
    action: 'REMOVE_TASK',
    category: 'task',
    description: 'Remove the current task from the list',
    examples: ['remove task', 'delete this', 'dont need this']
  },
  {
    id: 'reorder-task',
    patterns: [
      'move task up',
      'move task down',
      'change order',
      'reorder tasks',
      'move higher',
      'move lower',
      'more important',
      'less important'
    ],
    action: 'REORDER_TASK',
    category: 'task',
    parameters: {
      direction: 'string'
    },
    description: 'Change the order of tasks',
    examples: ['move task up', 'more important', 'move lower']
  },

  // Navigation Commands
  {
    id: 'go-to-tasks',
    patterns: [
      'show tasks',
      'go to tasks',
      'view tasks',
      'see my list',
      'whats on my list',
      'show me tasks',
      'task list',
      'my todos'
    ],
    action: 'NAVIGATE_TASKS',
    category: 'navigation',
    description: 'Navigate to the tasks view',
    examples: ['show tasks', 'whats on my list', 'task list']
  },
  {
    id: 'go-to-settings',
    patterns: [
      'show settings',
      'go to settings',
      'open settings',
      'preferences',
      'change settings',
      'settings menu',
      'options'
    ],
    action: 'NAVIGATE_SETTINGS',
    category: 'navigation',
    description: 'Navigate to settings',
    examples: ['show settings', 'preferences', 'options']
  },
  {
    id: 'start-session',
    patterns: [
      'start cleaning',
      'begin session',
      'lets go',
      'start now',
      'begin cleaning',
      'time to clean',
      'lets do this',
      'ready to start'
    ],
    action: 'START_SESSION',
    category: 'navigation',
    description: 'Start a cleaning or task session',
    examples: ['start cleaning', 'lets go', 'begin session']
  },
  {
    id: 'go-home',
    patterns: [
      'go home',
      'main menu',
      'back to start',
      'home screen',
      'dashboard',
      'main page'
    ],
    action: 'NAVIGATE_HOME',
    category: 'navigation',
    description: 'Navigate to home screen',
    examples: ['go home', 'main menu', 'dashboard']
  },

  // Status Query Commands
  {
    id: 'whats-next',
    patterns: [
      'whats next',
      'what should i do',
      'what now',
      'whats up next',
      'tell me next task',
      'what do i do now',
      'whats coming up'
    ],
    action: 'QUERY_NEXT_TASK',
    category: 'query',
    description: 'Ask what the next task is',
    examples: ['whats next', 'what should i do', 'what now']
  },
  {
    id: 'task-count',
    patterns: [
      'how many left',
      'tasks remaining',
      'how many more',
      'count left',
      'whats left',
      'how much more',
      'almost done'
    ],
    action: 'QUERY_TASK_COUNT',
    category: 'query',
    description: 'Ask how many tasks are remaining',
    examples: ['how many left', 'tasks remaining', 'whats left']
  },
  {
    id: 'current-progress',
    patterns: [
      'current progress',
      'how am i doing',
      'progress report',
      'status update',
      'where am i',
      'hows it going',
      'am i doing good'
    ],
    action: 'QUERY_PROGRESS',
    category: 'query',
    description: 'Get current progress update',
    examples: ['how am i doing', 'progress report', 'where am i']
  },
  {
    id: 'time-remaining',
    patterns: [
      'time left',
      'how long left',
      'time remaining',
      'when will i be done',
      'estimate time',
      'how much longer'
    ],
    action: 'QUERY_TIME_REMAINING',
    category: 'query',
    description: 'Ask about estimated time remaining',
    examples: ['time left', 'how long left', 'when will i be done']
  },

  // Body Double Commands
  {
    id: 'pause-talking',
    patterns: [
      'pause talking',
      'stop talking',
      'be quiet',
      'silence please',
      'shush',
      'quiet mode',
      'mute yourself',
      'stop speaking'
    ],
    action: 'BODY_DOUBLE_PAUSE',
    category: 'bodyDouble',
    description: 'Pause the body double voice',
    examples: ['pause talking', 'be quiet', 'silence please']
  },
  {
    id: 'resume-talking',
    patterns: [
      'resume talking',
      'start talking',
      'talk again',
      'keep talking',
      'continue speaking',
      'unmute',
      'speak up',
      'talk to me'
    ],
    action: 'BODY_DOUBLE_RESUME',
    category: 'bodyDouble',
    description: 'Resume the body double voice',
    examples: ['resume talking', 'talk again', 'keep talking']
  },
  {
    id: 'volume-up',
    patterns: [
      'speak louder',
      'volume up',
      'louder please',
      'cant hear you',
      'turn up',
      'increase volume',
      'speak up'
    ],
    action: 'BODY_DOUBLE_VOLUME_UP',
    category: 'bodyDouble',
    description: 'Increase body double volume',
    examples: ['speak louder', 'volume up', 'cant hear you']
  },
  {
    id: 'volume-down',
    patterns: [
      'speak quieter',
      'volume down',
      'too loud',
      'quieter please',
      'turn down',
      'decrease volume',
      'softer please'
    ],
    action: 'BODY_DOUBLE_VOLUME_DOWN',
    category: 'bodyDouble',
    description: 'Decrease body double volume',
    examples: ['speak quieter', 'too loud', 'volume down']
  },
  {
    id: 'encourage-me',
    patterns: [
      'encourage me',
      'motivate me',
      'cheer me on',
      'need support',
      'help me focus',
      'keep me going',
      'im struggling'
    ],
    action: 'BODY_DOUBLE_ENCOURAGE',
    category: 'bodyDouble',
    description: 'Request encouragement from body double',
    examples: ['encourage me', 'need support', 'im struggling']
  },

  // Settings Commands
  {
    id: 'toggle-voice',
    patterns: [
      'toggle voice',
      'voice on off',
      'turn voice on',
      'turn voice off',
      'enable voice',
      'disable voice'
    ],
    action: 'TOGGLE_VOICE',
    category: 'settings',
    description: 'Toggle voice commands on or off',
    examples: ['toggle voice', 'turn voice off', 'enable voice']
  },
  {
    id: 'change-theme',
    patterns: [
      'change theme',
      'dark mode',
      'light mode',
      'switch theme',
      'toggle theme',
      'different colors'
    ],
    action: 'CHANGE_THEME',
    category: 'settings',
    description: 'Change the app theme',
    examples: ['dark mode', 'change theme', 'switch theme']
  }
];

// Fuzzy matching algorithm for natural language understanding
export function fuzzyMatch(input: string, pattern: string): number {
  const normalizedInput = normalizeText(input);
  const normalizedPattern = normalizeText(pattern);

  // Exact match
  if (normalizedInput === normalizedPattern) return 1.0;

  // Contains pattern
  if (normalizedInput.includes(normalizedPattern)) return 0.9;

  // Pattern contains input (for partial commands)
  if (normalizedPattern.includes(normalizedInput)) return 0.8;

  // Word-based matching
  const inputWords = normalizedInput.split(' ');
  const patternWords = normalizedPattern.split(' ');

  // All pattern words found in input
  const allWordsFound = patternWords.every(word => 
    inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
  );
  if (allWordsFound) return 0.7;

  // Levenshtein distance for typos
  const distance = levenshteinDistance(normalizedInput, normalizedPattern);
  const maxLength = Math.max(normalizedInput.length, normalizedPattern.length);
  const similarity = 1 - (distance / maxLength);

  // If similarity is high enough, consider it a match
  if (similarity > 0.7) return similarity * 0.8;

  // Check for common word matches
  const commonWords = inputWords.filter(word => 
    patternWords.some(patternWord => 
      word === patternWord || 
      (word.length > 3 && patternWord.length > 3 && 
       (word.includes(patternWord) || patternWord.includes(word)))
    )
  );

  if (commonWords.length > 0) {
    return (commonWords.length / Math.max(inputWords.length, patternWords.length)) * 0.6;
  }

  return 0;
}

// Text normalization for better matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(the|a|an|is|are|was|were|been|be|have|has|had|do|does|did)\b/g, '') // Remove common words
    .trim();
}

// Levenshtein distance for typo tolerance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Parse voice input and find matching command
export function parseVoiceCommand(input: string): CommandMatch | null {
  let bestMatch: CommandMatch | null = null;
  let highestConfidence = 0;

  for (const command of voiceCommands) {
    for (const pattern of command.patterns) {
      const confidence = fuzzyMatch(input, pattern);

      if (confidence > highestConfidence && confidence >= 0.5) {
        highestConfidence = confidence;
        bestMatch = {
          command,
          confidence,
          matchedPattern: pattern,
          originalInput: input,
          parameters: extractParameters(input, command)
        };
      }
    }
  }

  return bestMatch;
}

// Extract parameters from voice input
function extractParameters(input: string, command: VoiceCommand): { [key: string]: any } | undefined {
  if (!command.parameters) return undefined;

  const parameters: { [key: string]: any } = {};

  // For add task command, extract the task title
  if (command.id === 'add-task') {
    // Remove command patterns from input to get the task title
    let taskTitle = input;
    for (const pattern of command.patterns) {
      const regex = new RegExp(`^${pattern}\\s*`, 'i');
      taskTitle = taskTitle.replace(regex, '').trim();
    }
    if (taskTitle) {
      parameters.taskTitle = taskTitle;
    }
  }

  // For reorder command, extract direction
  if (command.id === 'reorder-task') {
    if (input.match(/up|higher|top|first/i)) {
      parameters.direction = 'up';
    } else if (input.match(/down|lower|bottom|last/i)) {
      parameters.direction = 'down';
    }
  }

  return Object.keys(parameters).length > 0 ? parameters : undefined;
}

// Get commands by category
export function getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[] {
  return voiceCommands.filter(cmd => cmd.category === category);
}

// Get command suggestions based on partial input
export function getCommandSuggestions(partialInput: string, limit: number = 5): VoiceCommand[] {
  const matches: { command: VoiceCommand; confidence: number }[] = [];

  for (const command of voiceCommands) {
    let maxConfidence = 0;
    for (const pattern of command.patterns) {
      const confidence = fuzzyMatch(partialInput, pattern);
      maxConfidence = Math.max(maxConfidence, confidence);
    }

    if (maxConfidence > 0.3) {
      matches.push({ command, confidence: maxConfidence });
    }
  }

  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map(m => m.command);
}

// Validate command execution context
export function canExecuteCommand(command: VoiceCommand, context?: any): boolean {
  // Add context-specific validation here
  // For example, can't complete task if no task is selected
  switch (command.action) {
    case 'COMPLETE_CURRENT_TASK':
    case 'SKIP_TASK':
    case 'REMOVE_TASK':
      return context?.currentTask !== undefined;
    
    case 'PREVIOUS_TASK':
      return context?.hasPreviousTask === true;
    
    case 'NEXT_TASK':
      return context?.hasNextTask === true;
    
    default:
      return true;
  }
}

// Export command action types for type safety
export const CommandActions = {
  // Task actions
  COMPLETE_CURRENT_TASK: 'COMPLETE_CURRENT_TASK',
  NEXT_TASK: 'NEXT_TASK',
  PREVIOUS_TASK: 'PREVIOUS_TASK',
  SKIP_TASK: 'SKIP_TASK',
  ADD_TASK: 'ADD_TASK',
  REMOVE_TASK: 'REMOVE_TASK',
  REORDER_TASK: 'REORDER_TASK',
  
  // Navigation actions
  NAVIGATE_TASKS: 'NAVIGATE_TASKS',
  NAVIGATE_SETTINGS: 'NAVIGATE_SETTINGS',
  START_SESSION: 'START_SESSION',
  NAVIGATE_HOME: 'NAVIGATE_HOME',
  
  // Query actions
  QUERY_NEXT_TASK: 'QUERY_NEXT_TASK',
  QUERY_TASK_COUNT: 'QUERY_TASK_COUNT',
  QUERY_PROGRESS: 'QUERY_PROGRESS',
  QUERY_TIME_REMAINING: 'QUERY_TIME_REMAINING',
  
  // Body double actions
  BODY_DOUBLE_PAUSE: 'BODY_DOUBLE_PAUSE',
  BODY_DOUBLE_RESUME: 'BODY_DOUBLE_RESUME',
  BODY_DOUBLE_VOLUME_UP: 'BODY_DOUBLE_VOLUME_UP',
  BODY_DOUBLE_VOLUME_DOWN: 'BODY_DOUBLE_VOLUME_DOWN',
  BODY_DOUBLE_ENCOURAGE: 'BODY_DOUBLE_ENCOURAGE',
  
  // Settings actions
  TOGGLE_VOICE: 'TOGGLE_VOICE',
  CHANGE_THEME: 'CHANGE_THEME'
} as const;

export type CommandActionType = typeof CommandActions[keyof typeof CommandActions];