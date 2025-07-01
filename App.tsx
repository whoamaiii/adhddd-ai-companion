import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { TaskList } from './components/TaskList';
import { CelebrationScreen } from './components/CelebrationScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SettingsPanel } from './components/SettingsPanel';
import { MessageCard } from './components/MessageCard';
import { LandingPage } from './components/LandingPage';
import Footer from './components/Footer';
import LogMomentPage from './components/sensory_tracker/LogMomentPage';
import TimelinePage from './components/sensory_tracker/TimelinePage';
import DashboardPage from './components/sensory_tracker/DashboardPage';
import BottomNav from './components/shared/BottomNav';
import { AppScreen } from './types';
import type { Task, ImageAnalysisObservation, SensoryMoment } from './types';
import { analyzeImageWithGemini, generateCleaningPlanWithGemini, generateCelebratoryMessageForTask } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { AgentOrchestrator } from './services/agents/AgentOrchestrator';
import { FocusAgent } from './services/agents/core/FocusAgent';
import { MotivationAgent } from './services/agents/core/MotivationAgent';
import type { AgentContext } from './services/agents/AgentTypes';

const App: React.FC = () => {
  // Initialize agent system
  const [agentOrchestrator] = useState(() => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.registerAgent(new FocusAgent());
    orchestrator.registerAgent(new MotivationAgent());
    return orchestrator;
  });
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>([]); // Suggestions provided by AI agents
  const [apiKey, setApiKey] = useState<string | null>(null); // Stores the Gemini API key
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.Home); // Manages the current view of the application
  const [, setUploadedImages] = useState<string[] | null>(null); // Stores base64 encoded strings of uploaded images
  const [, setImageAnalysis] = useState<ImageAnalysisObservation[]>([]);
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('adhddd_tasks');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        // Basic validation
        if (Array.isArray(parsed)) {
          console.log(`[Data Persistence] Loaded ${parsed.length} tasks from localStorage`);
          return parsed;
        }
      }
      console.log('[Data Persistence] No existing tasks found in localStorage');
    } catch (e) {
      console.error('[Data Persistence] Failed to load tasks from localStorage:', e);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0); // Index of the currently focused task in the tasks array
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [enableVoice, setEnableVoice] = useState<boolean>(false); // User preference for voice assistance
  const [enableGamification, setEnableGamification] = useState<boolean>(true); // User preference for gamification features
  const [streak, setStreak] = useState<number>(0); // Current task completion streak

  // const [lastCommandFeedback] = useState<string>(''); // This state was confirmed unused and its declaration removed.
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0); // Counter for tasks marked as complete in the current session/list
  
  // Sensory Tracker state
  const [sensoryMoments, setSensoryMoments] = useState<SensoryMoment[]>(() => { // Stores logged sensory moments for the tracker feature
    try {
      const savedMoments = localStorage.getItem('adhddd_sensoryMoments');
      if (savedMoments) {
        const parsed = JSON.parse(savedMoments);
        // Basic validation
        if (Array.isArray(parsed)) {
          // Conditional logging for development environment
          if (import.meta.env.DEV) {
            console.log(`[Data Persistence] Loaded ${parsed.length} sensory moments from localStorage`);
          }
          return parsed;
        }
      }
      // Conditional logging for development environment
      if (import.meta.env.DEV) {
        console.log('[Data Persistence] No existing sensory moments found in localStorage');
      }
    } catch (e) {
      console.error('[Data Persistence] Failed to load sensory moments from localStorage:', e);
    }
    return [];
  });

  const [customBehaviors, setCustomBehaviors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('adhddd_customBehaviors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('[Data Persistence] Failed to load custom behaviors:', e);
    }
    return [];
  });
  
  const [customEnvironments, setCustomEnvironments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('adhddd_customEnvironments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('[Data Persistence] Failed to load custom environments:', e);
    }
    return [];
  });

  // Persistence effects
  // Effect to save tasks to localStorage whenever the tasks state changes.
  useEffect(() => {
    try {
      localStorage.setItem('adhddd_tasks', JSON.stringify(tasks));
      if (import.meta.env.DEV) {
        console.log(`[Data Persistence] Saved ${tasks.length} tasks to localStorage`);
      }
    } catch (e) {
      console.error('[Data Persistence] Failed to save tasks to localStorage:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('adhddd_sensoryMoments', JSON.stringify(sensoryMoments));
      if (import.meta.env.DEV) {
        console.log(`[Data Persistence] Saved ${sensoryMoments.length} sensory moments to localStorage`);
      }
    } catch (e) {
      console.error('[Data Persistence] Failed to save sensory moments to localStorage:', e);
    }
  }, [sensoryMoments]);

  useEffect(() => {
    try {
      localStorage.setItem('adhddd_customBehaviors', JSON.stringify(customBehaviors));
    } catch (e) {
      console.error('[Data Persistence] Failed to save custom behaviors:', e);
    }
  }, [customBehaviors]);

  useEffect(() => {
    try {
      localStorage.setItem('adhddd_customEnvironments', JSON.stringify(customEnvironments));
    } catch (e) {
      console.error('[Data Persistence] Failed to save custom environments:', e);
    }
  }, [customEnvironments]);

  const handleAddCustomTag = useCallback((tag: string, type: 'behavior' | 'environment') => {
    if (!tag.trim()) return;
    const sanitizedTag = tag.trim();
    
    if (type === 'behavior') {
      setCustomBehaviors(prev => [...new Set([...prev, sanitizedTag])]);
    } else {
      setCustomEnvironments(prev => [...new Set([...prev, sanitizedTag])]);
    }
  }, []);

  const handleDeleteCustomTag = useCallback((tag: string, type: 'behavior' | 'environment') => {
    if (type === 'behavior') {
      setCustomBehaviors(prev => prev.filter(t => t !== tag));
    } else {
      setCustomEnvironments(prev => prev.filter(t => t !== tag));
    }
  }, []);

  const handleLaunchCleaningTool = useCallback(() => {
    setCurrentScreen(AppScreen.ImageUpload);
  }, []);

  // Sensory Tracker handlers
  const handleSaveMoment = useCallback((momentData: Omit<SensoryMoment, 'id' | 'timestamp'>) => {
    const newMoment: SensoryMoment = {
      id: uuidv4(),
      timestamp: Date.now(),
      behaviors: momentData.behaviors,
      environment: momentData.environment,
      overallState: momentData.overallState,
      contextNote: momentData.contextNote,
    };
    
    setSensoryMoments(prev => [newMoment, ...prev]);
    setCurrentScreen(AppScreen.Timeline);
  }, []);

  const handleCancelLogMoment = useCallback(() => {
    setCurrentScreen(AppScreen.Dashboard);
  }, []);

  const handleLaunchSensoryTracker = useCallback(() => {
    console.log("Launching Sensory Tracker");
    setCurrentScreen(AppScreen.LogMoment);
  }, []);

  const speak = useCallback((text: string) => {
    if (enableVoice && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [enableVoice]);

  const handleAddTask = useCallback((taskText: string) => {
    if (!taskText.trim()) return;

    const newTask: Task = {
      id: uuidv4(),
      text: taskText.trim(),
      isCompleted: false,
    };

    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      if (currentTaskIndex === -1 || prevTasks.every((t: Task) => t.isCompleted)) {
        setCurrentTaskIndex(updatedTasks.length - 1);
      } else if (prevTasks.length === 0) {
        setCurrentTaskIndex(0);
      }
      return updatedTasks;
    });
    speak(`Added task: ${newTask.text.split('@')[0].trim()}`);
  }, [currentTaskIndex, speak]);

/**
 * Determines the index of the next incomplete task to focus on.
 * It searches forward from the position of the just-completed task, wrapping around the list.
 * @param tasksList The array of all tasks.
 * @param completedTaskId The ID of the task that was just completed.
 * @returns The index of the next incomplete task, or -1 if all tasks are completed.
 */
const determineNextTaskIndex = (tasksList: Task[], completedTaskId: string): number => {
  const currentCompletedTaskIndex = tasksList.findIndex(task => task.id === completedTaskId);

  // Should not happen if logic is correct, but as a safeguard:
  if (currentCompletedTaskIndex === -1) return tasksList.findIndex(t => !t.isCompleted) ?? -1;

  for (let i = 1; i <= tasksList.length; i++) {
    const nextPotentialIndex = (currentCompletedTaskIndex + i) % tasksList.length;
    if (!tasksList[nextPotentialIndex].isCompleted) {
      return nextPotentialIndex;
    }
  }
  return -1; // All tasks are completed
};

  // Handles the completion of a task.
  // Updates task state, triggers AI celebration, and navigates to the next task or completion screen.
  const handleTaskComplete = useCallback(async (taskId: string) => {
    let completedTaskTextForAISpeech = "";
    const updatedTasks = tasks.map((task: Task) => {
      if (task.id === taskId) {
        completedTaskTextForAISpeech = task.text; // Capture text for AI message before marking complete
        return { ...task, isCompleted: true };
      }
      return task;
    });
    setTasks(updatedTasks);
    setCompletedTasksCount(prev => prev + 1);

    // Generate and speak an AI-powered celebratory message for the completed task.
    // Falls back to a generic message if AI generation fails or API key is missing.
    let celebrationMessage = `Great job completing: ${completedTaskTextForAISpeech.split('@')[0].trim()}`;
    if (apiKey && completedTaskTextForAISpeech) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const aiCelebration = await generateCelebratoryMessageForTask(ai, completedTaskTextForAISpeech);
        if (aiCelebration) {
          celebrationMessage = aiCelebration;
        }
      } catch (e) {
        console.error("Failed to get AI celebratory message:", e);
        // Fallback to the generic message (already initialized)
      }
    }
    speak(celebrationMessage);
    
    // Check if all tasks are now completed.
    const allTasksNowCompleted = updatedTasks.every((task: Task) => task.isCompleted);

    if (allTasksNowCompleted) {
        speak("Fantastic! You've completed all tasks for this area!");
        if (enableGamification) {
            setStreak((s: number) => s + 1); // Increment streak if gamification is enabled
        }
        setCurrentScreen(AppScreen.AllTasksCompleted); // Navigate to the completion screen
    } else {
      // If there are remaining tasks, determine the next one to focus on.
      const nextIncompleteTaskIndex = determineNextTaskIndex(updatedTasks, taskId);
      
      if (nextIncompleteTaskIndex !== -1) {
        setTimeout(() => {
          setCurrentTaskIndex(nextIncompleteTaskIndex);
          // Voice announcement for the new current task is handled by a separate useEffect.
        }, 500); // Small delay to allow completion feedback to be processed.
      } else { 
        // This case should ideally be covered by allTasksNowCompleted, but as a fallback:
        speak("Looks like that was the last one! Amazing!");
         if (enableGamification) {
            setStreak((s: number) => s + 1);
        }
        setCurrentScreen(AppScreen.AllTasksCompleted);
      }
    }
  }, [tasks, speak, enableGamification, apiKey]); // Dependencies for the useCallback


  // Effect to initialize the Gemini API key from environment variables.
  // Sets an error state if the API key is not found, as it's critical for app functionality.
  useEffect(() => {
    const keyFromEnv = import.meta.env.VITE_GEMINI_API_KEY;
    if (keyFromEnv) {
      setApiKey(keyFromEnv);
    } else {
      console.error("API Key not found in import.meta.env.VITE_GEMINI_API_KEY. The app will not function correctly.");
      setError("CRITICAL: API Key is not configured. Please ensure the VITE_GEMINI_API_KEY environment variable is set correctly in your .env.local file and that the application has been rebuilt/restarted if changes were made. The application cannot operate without it.");
      setCurrentScreen(AppScreen.Error);
    }
  }, []);

  const handleImageUpload = useCallback(async (imageDataUrls: string[]) => {
    if (!apiKey) {
      setError("API Key is not configured. Cannot proceed. Ensure VITE_GEMINI_API_KEY is set.");
      setCurrentScreen(AppScreen.Error);
      return;
    }
    if (imageDataUrls.length === 0) {
      setError("No images were provided for analysis.");
      return; 
    }
    setUploadedImages(imageDataUrls);
    setIsLoading(true);
    setError(null);
    setCurrentScreen(AppScreen.Processing);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const analysisResults = await analyzeImageWithGemini(ai, imageDataUrls);
      setImageAnalysis(analysisResults);

      if (analysisResults.length === 0) {
        setError("The AI could not identify actionable items from the image(s). Try a different view or image.");
        setCurrentScreen(AppScreen.ImageUpload);
        setUploadedImages(null);
        setIsLoading(false);
        return;
      }

      const plan : Partial<Task>[] = await generateCleaningPlanWithGemini(ai, analysisResults);
      const tasksWithIds: Task[] = plan.map(taskDetails => ({
        id: uuidv4(),
        text: taskDetails.text || "Unnamed task",
        isCompleted: false,
        estimatedTime: taskDetails.estimatedTime,
        difficulty: taskDetails.difficulty,
        prioritizationHint: taskDetails.prioritizationHint,
        // Include spatial enhancement fields if available
        ...(taskDetails.spatialContext && { spatialContext: taskDetails.spatialContext }),
        ...(taskDetails.suggestedTools && { suggestedTools: taskDetails.suggestedTools }),
        ...(taskDetails.relatedObjects && { relatedObjects: taskDetails.relatedObjects }),
        ...(taskDetails.locationDescription && { locationDescription: taskDetails.locationDescription }),
        ...(taskDetails.visualCues && { visualCues: taskDetails.visualCues }),
      }));
      setTasks(tasksWithIds);
      setCurrentTaskIndex(0);
      setCurrentScreen(AppScreen.Tasks);
    } catch (err) {
      console.error("Error processing image(s) or generating plan:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during AI processing.");
      setCurrentScreen(AppScreen.Error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleReset = () => {
    setUploadedImages(null);
    setImageAnalysis([]);
    setTasks([]);
    setError(null);
    setCurrentTaskIndex(0);
    setCurrentScreen(AppScreen.ImageUpload);
    speak("Let's tackle a new area!");
  };
  
  useEffect(() => {
    if (enableVoice && currentScreen === AppScreen.Tasks && tasks.length > 0 && tasks[currentTaskIndex] && !tasks[currentTaskIndex].isCompleted) {
      speak(`Current task: ${tasks[currentTaskIndex].text.split('@')[0].trim()}`);
    }
  }, [currentTaskIndex, tasks, currentScreen, speak, enableVoice]);

  // Agent recommendations effect
  // This effect is responsible for fetching and displaying suggestions from AI agents
  // when the user is on the Tasks screen and there are tasks loaded.
  // Dependencies:
  // - currentScreen: Only runs when on AppScreen.Tasks.
  // - tasks: Re-evaluates if the tasks list changes.
  // - currentTaskIndex: Re-evaluates if the focused task changes.
  // - completedTasksCount: Re-evaluates if a task is completed.
  // - agentOrchestrator: Stable, but included as it's used to fetch recommendations.
  useEffect(() => {
    const getAgentRecommendations = async () => {
      if (currentScreen !== AppScreen.Tasks || tasks.length === 0) {
        setAgentSuggestions([]);
        return;
      }

      const currentTask = tasks[currentTaskIndex];
      const context: AgentContext = {
        currentTask: currentTask ? {
          title: currentTask.text,
          isCompleted: currentTask.isCompleted
        } : undefined,
        allTasks: tasks,
        completedTasksCount: completedTasksCount,
        userMood: tasks.filter(t => !t.isCompleted).length > 5 ? 'overwhelmed' : 'neutral', // Basic mood detection
        sessionHistory: [], // Placeholder: Could track user actions for more advanced agent insights in the future
        timeOfDay: (() => { // Determine time of day for context-aware suggestions
          const hour = new Date().getHours();
          if (hour < 12) return 'morning';
          if (hour < 18) return 'afternoon';
          return 'evening';
        })(),
      };

      try {
        const recommendations = await agentOrchestrator.getRecommendations(context);
        const suggestions: string[] = [];
        
        recommendations.forEach(rec => {
          if (rec.message) {
            suggestions.push(rec.message);
          }
          if (rec.suggestions) {
            suggestions.push(...rec.suggestions);
          }
        });

        setAgentSuggestions(suggestions.slice(0, 3)); // Show top 3 suggestions
      } catch (error) {
        console.error('Failed to get agent recommendations:', error);
        setAgentSuggestions([]);
      }
    };

    getAgentRecommendations();
  }, [currentScreen, tasks, currentTaskIndex, completedTasksCount, agentOrchestrator]);

  const handleTaskReorder = (draggedTaskId: string, targetTaskId: string) => {
    const currentFocusedTaskId = tasks[currentTaskIndex]?.id;
    
    const draggedItemIndex = tasks.findIndex(task => task.id === draggedTaskId);
    const targetItemIndex = tasks.findIndex(task => task.id === targetTaskId);

    if (draggedItemIndex === -1 || targetItemIndex === -1 || draggedItemIndex === targetItemIndex) {
      return;
    }

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedItemIndex, 1);
    
    const adjustedTargetIndex = draggedItemIndex < targetItemIndex ? targetItemIndex -1 : targetItemIndex;
    
    newTasks.splice(adjustedTargetIndex, 0, draggedItem);
    setTasks(newTasks);

    if (currentFocusedTaskId) {
      const newFocusIndex = newTasks.findIndex(t => t.id === currentFocusedTaskId);
      setCurrentTaskIndex(newFocusIndex !== -1 ? newFocusIndex : 0);
    } else {
      const firstNonCompleted = newTasks.findIndex(t => !t.isCompleted);
      setCurrentTaskIndex(firstNonCompleted !== -1 ? firstNonCompleted : 0);
    }
  };

  const renderContent = () => {
    if (isLoading || currentScreen === AppScreen.Processing) {
      return <LoadingSpinner message={currentScreen === AppScreen.Processing ? "AI is analyzing and planning..." : "Loading..."} />;
    }
    if (currentScreen === AppScreen.Error && error) {
      return <MessageCard type="error" title="An Error Occurred" message={error} onDismiss={() => {
        setError(null);
        setCurrentScreen(apiKey ? AppScreen.ImageUpload : AppScreen.Welcome);
      }} />;
    }
    
    if (currentScreen === AppScreen.Welcome) {
         return (
            <div className="text-left p-4 md:p-6">
                <h2 className="text-[var(--text-primary)] text-2xl font-bold leading-tight tracking-tight pb-1">Welcome to ADHD Cleaning Companion!</h2>
                <p className="text-[var(--text-secondary)] text-base font-normal leading-relaxed pb-8">Ready to tackle your tasks? Let's make today productive and stress-free. Please ensure your API key is set up to begin.</p>
                 <ImageUploader onImageUpload={handleImageUpload} />
            </div>
         );
    }

    switch (currentScreen) {
      case AppScreen.Home:
        return <LandingPage onLaunchCleaningTool={handleLaunchCleaningTool} onLaunchSensoryTracker={handleLaunchSensoryTracker} />;
      case AppScreen.ImageUpload:
        return <ImageUploader onImageUpload={handleImageUpload} />;
      case AppScreen.Tasks:
        if (tasks.length > 0) {
          return (
            <TaskList
              tasks={tasks}
              currentTaskIndex={currentTaskIndex}
              onTaskComplete={handleTaskComplete}
              onFocusTask={(index) => {
                if (!tasks[index].isCompleted) {
                  setCurrentTaskIndex(index);
                }
              }}
              onTaskReorder={handleTaskReorder}
              draggingItemId={draggingItemId}
              onTaskDragStart={setDraggingItemId}
              onTaskDragEnd={() => setDraggingItemId(null)}
              onAddTask={handleAddTask}
              agentSuggestions={agentSuggestions}
            />
          );
        }
        return (
            <div>
                 <MessageCard type="info" title="No Tasks Generated (Yet!)" message="The AI didn't generate any tasks from images, or you haven't uploaded any. You can add your own tasks below!" onDismiss={handleReset} />
                 <TaskList
                    tasks={tasks} 
                    currentTaskIndex={currentTaskIndex}
                    onTaskComplete={handleTaskComplete}
                    onFocusTask={(index) => setCurrentTaskIndex(index)}
                    onTaskReorder={handleTaskReorder}
                    draggingItemId={draggingItemId}
                    onTaskDragStart={setDraggingItemId}
                    onTaskDragEnd={() => setDraggingItemId(null)}
                    onAddTask={handleAddTask}
                />
            </div>
        );
      case AppScreen.AllTasksCompleted:
        return (
          <CelebrationScreen
            completedTasks={tasks}
            streak={streak}
            enableGamification={enableGamification}
            enableVoice={enableVoice}
            onReset={handleReset}
            apiKey={apiKey}
          />
        );
      // Sensory Tracker screens
      case AppScreen.LogMoment:
        return <LogMomentPage 
            onSaveMoment={handleSaveMoment} 
            onCancel={handleCancelLogMoment}
            customBehaviors={customBehaviors}
            customEnvironments={customEnvironments}
        />;
      case AppScreen.Timeline:
        return (
          <TimelinePage 
            moments={sensoryMoments} 
            customBehaviors={customBehaviors}
            customEnvironments={customEnvironments}
            onAddCustomTag={handleAddCustomTag}
            onDeleteCustomTag={handleDeleteCustomTag}
          />
        );
      case AppScreen.Dashboard:
        return <DashboardPage moments={sensoryMoments} />;
      default: 
        if (!apiKey) {
            return <LoadingSpinner message="Initializing..." />;
        }
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden bg-[var(--background-primary)] dark">
      <Header 
        streak={enableGamification ? streak : undefined}
        title={currentScreen === AppScreen.Home ? "ONE APP" : "ADHD Cleaning Companion"}
        onToggleSettings={() => setIsSettingsOpen(prev => !prev)}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
      
      <main className="flex-grow">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>

      {/* Voice Command Feedback JSX removed as the 'lastCommandFeedback' state was removed. */}

      {/* Show BottomNav only for sensory tracker screens */}
      {[AppScreen.LogMoment, AppScreen.Timeline, AppScreen.Dashboard].includes(currentScreen) && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        enableVoice={enableVoice}
        onToggleVoice={() => {
            setEnableVoice(prev => {
                const newState = !prev;
                if (newState) {
                    speak("Voice assistance enabled.");
                } else {
                    window.speechSynthesis.cancel();
                }
                return newState;
            });
        }}
        enableGamification={enableGamification}
        onToggleGamification={() => setEnableGamification(g => !g)}
      />
      
      <Footer />
    </div>
  );
};

export default App;
