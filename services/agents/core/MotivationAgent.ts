import { BaseAgent, AgentContext, AgentResponse, AgentCategory, AgentConfig } from '../AgentTypes';

export class MotivationAgent extends BaseAgent {
  private motivationalQuotes = [
    "Every small step counts! You're making progress! 🌟",
    "You've got this! One task at a time! 💪",
    "Look how far you've come already! Keep going! 🚀",
    "Your effort matters, even if it feels small! ✨",
    "Progress over perfection - you're doing great! 🎯",
    "You're stronger than you think! 💖",
    "Each completed task is a victory! 🏆",
    "Your future self will thank you! 🙌"
  ];

  private celebrationMessages = [
    "🎉 AMAZING! You crushed that task!",
    "🌟 Superstar alert! Another one done!",
    "🚀 You're on fire! Keep that momentum!",
    "💫 Incredible work! You're unstoppable!",
    "🏆 Champion move! That was awesome!"
  ];

  constructor() {
    const config: AgentConfig = {
      id: 'motivation',
      name: 'Motivation Coach',
      description: 'Provides encouragement and celebrates achievements',
      category: AgentCategory.CORE,
      capabilities: [
        {
          name: 'encourage',
          description: 'Offers motivational support',
          triggerPhrases: ['need motivation', 'feeling stuck', 'can\'t do this', 'too tired']
        },
        {
          name: 'celebrate',
          description: 'Celebrates task completion'
        }
      ],
      priority: 1,
      isActive: true,
      personality: {
        tone: 'energetic',
        emoji: '⚡'
      }
    };
    super(config);
  }

  canHelp(context: AgentContext): boolean {
    const needsMotivation = context.userMood === 'frustrated' || 
                           context.userMood === 'tired' ||
                           context.completedTasksCount === 0;
    
    const shouldCelebrate = !!(context.completedTasksCount &&
                           context.completedTasksCount > 0 &&
                           context.completedTasksCount % 3 === 0);
    
    return needsMotivation || shouldCelebrate;
  }

  async analyze(context: AgentContext): Promise<AgentResponse | null> {
    if (!this.canHelp(context)) return null;

    let message: string;
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (context.completedTasksCount && context.completedTasksCount > 0) {
      message = this.getCelebrationMessage(context.completedTasksCount);
      priority = 'high';
    } else {
      message = this.getMotivationalMessage();
    }

    return this.createResponse(message, {
      priority,
      actionItems: [{
        type: 'motivate',
        payload: { 
          streakCount: context.completedTasksCount || 0,
          achievement: this.checkForAchievements(context)
        }
      }]
    });
  }

  private getMotivationalMessage(): string {
    const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
    return `${this.config.personality?.emoji} ${this.motivationalQuotes[randomIndex]}`;
  }

  private getCelebrationMessage(completedCount: number): string {
    const randomIndex = Math.floor(Math.random() * this.celebrationMessages.length);
    const base = this.celebrationMessages[randomIndex];
    
    if (completedCount === 5) {
      return `${base} 🎊 You've completed 5 tasks! You're building great momentum!`;
    } else if (completedCount === 10) {
      return `${base} 🏅 Double digits! 10 tasks completed - you're a cleaning warrior!`;
    } else if (completedCount % 5 === 0) {
      return `${base} 🎯 ${completedCount} tasks done! You're absolutely crushing it!`;
    }
    
    return base;
  }

  private checkForAchievements(context: AgentContext): string | null {
    const count = context.completedTasksCount || 0;
    
    if (count === 1) return "First Step Hero";
    if (count === 5) return "High Five Champion";
    if (count === 10) return "Cleaning Warrior";
    if (count === 25) return "Organization Master";
    if (count === 50) return "Legendary Achiever";
    
    return null;
  }
}