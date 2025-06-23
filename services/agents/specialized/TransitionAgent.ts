import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class TransitionAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      id: 'transition',
      name: 'Transition Helper',
      description: 'Eases task switching and reduces transition friction',
      category: AgentCategory.TASK_MANAGEMENT,
      capabilities: [
        {
          name: 'smooth-transition',
          description: 'Helps switch between tasks',
          triggerPhrases: ['next task', 'finished', 'what now', 'done with this']
        },
        {
          name: 'closure-ritual',
          description: 'Creates completion rituals'
        }
      ],
      priority: 2,
      isActive: true,
      personality: {
        tone: 'calm',
        emoji: '🔄'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    const justCompleted = context.sessionHistory && 
                         context.sessionHistory[context.sessionHistory.length - 1]?.type === 'task_completed';
    
    const frequentSwitching = context.sessionHistory &&
                             context.sessionHistory.filter(h => h.type === 'task_skipped').length > 1;
    
    return justCompleted || frequentSwitching;
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    const transitionRitual = this.getTransitionRitual(context);
    const nextTaskPrep = this.prepareForNextTask(context);

    return this.createResponse(
      `${this.config.personality?.emoji} Great job! Let's transition smoothly to the next task.`,
      {
        suggestions: [...transitionRitual, ...nextTaskPrep],
        priority: 'medium',
        actionItems: [{
          type: 'suggest',
          payload: {
            ritual: 'transition',
            duration: 60 // 1 minute transition
          }
        }]
      }
    );
  }

  private getTransitionRitual(context: AgentContext): string[] {
    const rituals = [
      '✨ Take a moment to appreciate what you just accomplished',
      '🧘 Take 3 deep breaths',
      '💧 Have a sip of water',
      '🎯 Physically move to the next task area',
      '🙌 Do a quick stretch or shake'
    ];

    if (context.completedTasksCount && context.completedTasksCount % 3 === 0) {
      rituals.push('🏆 You\'ve completed 3 tasks - do a victory dance!');
    }

    return rituals.slice(0, 3);
  }

  private prepareForNextTask(context: AgentContext): string[] {
    return [
      '👀 Visualize the next task completed',
      '🎵 Change the music/ambiance if needed',
      '📍 Clear your mind of the previous task'
    ];
  }
}