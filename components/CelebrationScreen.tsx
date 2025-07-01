import React, { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';

// Celebration stages enum for clean state management
enum CelebrationStage {
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
  SUMMARY = 'SUMMARY', 
  AI_PRAISE = 'AI_PRAISE',
  CALL_TO_ACTION = 'CALL_TO_ACTION'
}

interface CelebrationScreenProps {
  completedTasks: Task[];
  streak: number;
  enableGamification: boolean;
  enableVoice: boolean;
  onReset: () => void;
  apiKey: string | null;
}

export const CelebrationScreen: React.FC<CelebrationScreenProps> = ({
  completedTasks,
  streak,
  enableGamification,
  enableVoice,
  onReset,
  apiKey
}) => {
  const [currentStage, setCurrentStage] = useState<CelebrationStage>(CelebrationStage.ACKNOWLEDGMENT);
  const [aiPraiseMessage, setAiPraiseMessage] = useState<string>('');
  const [isAiMessageLoading, setIsAiMessageLoading] = useState<boolean>(false);
  
  // Check for reduced motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calculate task statistics
  const taskStats = React.useMemo(() => {
    const totalTasks = completedTasks.length;
    const estimatedMinutes = completedTasks.reduce((total, task) => {
      const timeMatch = task.estimatedTime?.match(/(\d+)/);
      return total + (timeMatch ? parseInt(timeMatch[1]) : 5); // Default 5min if no estimate
    }, 0);
    const difficultTasks = completedTasks.filter(task => 
      task.difficulty === 'hard' || task.difficulty === 'medium'
    ).length;
    
    return { totalTasks, estimatedMinutes, difficultTasks };
  }, [completedTasks]);

  // Fetch AI praise message in parallel with early stages
  const fetchAiPraise = useCallback(async () => {
    if (!apiKey || completedTasks.length === 0) return;
    
    setIsAiMessageLoading(true);
    try {
      // Import here to avoid bundling in main chunk
      const { GoogleGenAI } = await import('@google/genai');
      const { generateCompletionSummary } = await import('../services/geminiService');
      
      const ai = new GoogleGenAI({ apiKey });
      const message = await generateCompletionSummary(ai, completedTasks);
      setAiPraiseMessage(message || 'Amazing work! You conquered every task on your list!');
    } catch (error) {
      console.error('Failed to generate AI praise:', error);
      setAiPraiseMessage('Outstanding job completing all your tasks! Your persistence paid off!');
    } finally {
      setIsAiMessageLoading(false);
    }
  }, [apiKey, completedTasks]);

  // Stage progression with timer cascade
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    switch (currentStage) {
      case CelebrationStage.ACKNOWLEDGMENT:
        // Start AI fetch in parallel
        fetchAiPraise();
        // Play celebration sound if not muted
        if (enableVoice && !reduceMotion) {
          // Placeholder for celebration sound
          console.log('🎉 Celebration sound would play here');
        }
        timeoutId = setTimeout(() => setCurrentStage(CelebrationStage.SUMMARY), 2000);
        break;
        
      case CelebrationStage.SUMMARY:
        timeoutId = setTimeout(() => setCurrentStage(CelebrationStage.AI_PRAISE), 3000);
        break;
        
      case CelebrationStage.AI_PRAISE:
        timeoutId = setTimeout(() => setCurrentStage(CelebrationStage.CALL_TO_ACTION), 3000);
        break;
        
      case CelebrationStage.CALL_TO_ACTION:
        // Final stage - no automatic progression
        break;
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStage, fetchAiPraise, enableVoice, reduceMotion]);

  // Voice announcement for accessibility
  useEffect(() => {
    if (enableVoice && 'speechSynthesis' in window) {
      let announcement = '';
      
      switch (currentStage) {
        case CelebrationStage.ACKNOWLEDGMENT:
          announcement = 'Congratulations! All tasks completed!';
          break;
        case CelebrationStage.SUMMARY:
          announcement = `You completed ${taskStats.totalTasks} tasks and conquered ${taskStats.estimatedMinutes} minutes of work!`;
          break;
        case CelebrationStage.AI_PRAISE:
          if (aiPraiseMessage) announcement = aiPraiseMessage;
          break;
        case CelebrationStage.CALL_TO_ACTION:
          announcement = enableGamification ? `Your cleaning streak is now ${streak}!` : '';
          break;
      }
      
      if (announcement) {
        const utterance = new SpeechSynthesisUtterance(announcement);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentStage, enableVoice, taskStats, aiPraiseMessage, streak, enableGamification]);

  const renderCurrentStage = () => {
    switch (currentStage) {
      case CelebrationStage.ACKNOWLEDGMENT:
        return (
          <div className="text-center" aria-live="polite">
            <div className={`mb-6 ${!reduceMotion ? 'animate-bounce' : ''}`}>
              <i className="fas fa-party-popper text-6xl text-[var(--warning-color)]"></i>
            </div>
            <h1 className="text-4xl font-bold text-[var(--success-color)] mb-2">
              All Done!
            </h1>
            <p className="text-xl text-[var(--text-primary)]">
              🎉 Incredible work! 🎉
            </p>
          </div>
        );

      case CelebrationStage.SUMMARY:
        return (
          <div className="text-center" aria-live="polite">
            <div className="mb-6">
              <i className="fas fa-chart-line text-5xl text-[var(--primary-color)]"></i>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
              Look What You Accomplished!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-[var(--background-secondary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--primary-color)]">
                  {taskStats.totalTasks}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Tasks Completed
                </div>
              </div>
              <div className="bg-[var(--background-secondary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--success-color)]">
                  {taskStats.estimatedMinutes}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Minutes Conquered
                </div>
              </div>
              <div className="bg-[var(--background-secondary)] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[var(--warning-color)]">
                  {taskStats.difficultTasks}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Challenging Tasks
                </div>
              </div>
            </div>
          </div>
        );

      case CelebrationStage.AI_PRAISE:
        return (
          <div className="text-center" aria-live="polite">
            <div className="mb-6">
              <i className="fas fa-sparkles text-5xl text-[var(--primary-color)]"></i>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Personal Recognition
            </h2>
            {isAiMessageLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-[var(--text-secondary)]">Crafting your praise...</span>
              </div>
            ) : (
              <blockquote className="text-lg italic text-[var(--text-primary)] bg-[var(--background-secondary)] p-6 rounded-lg max-w-2xl mx-auto">
                "{aiPraiseMessage}"
              </blockquote>
            )}
          </div>
        );

      case CelebrationStage.CALL_TO_ACTION:
        return (
          <div className="text-center" aria-live="polite">
            <div className="mb-6">
              <i className="fas fa-trophy text-5xl text-[var(--warning-color)]"></i>
            </div>
            {enableGamification && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Cleaning Streak
                </h2>
                <div className="text-4xl font-bold text-[var(--primary-color)]">
                  {streak} {streak > 0 ? '🔥' : ''}
                </div>
                <p className="text-[var(--text-secondary)] mt-2">
                  {streak === 1 ? 'Great start!' : streak < 5 ? 'Building momentum!' : 'On fire! 🚀'}
                </p>
              </div>
            )}
            <button
              onClick={onReset}
              className={`
                bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] 
                text-white font-semibold py-4 px-8 rounded-lg shadow-lg 
                transition duration-150 ease-in-out 
                ${!reduceMotion ? 'transform hover:scale-105' : ''}
                focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-50
              `}
              aria-label="Start cleaning another area"
            >
              <i className="fas fa-home mr-2"></i>
              Clean Another Area
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="bg-[var(--background-secondary)] shadow-2xl rounded-2xl p-8 max-w-4xl w-full">
        {renderCurrentStage()}
      </div>
    </div>
  );
};
