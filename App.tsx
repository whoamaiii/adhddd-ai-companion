import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { TaskList } from './components/TaskList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SettingsPanel } from './components/SettingsPanel';
import { MessageCard } from './components/MessageCard';
import { LandingPage } from './components/LandingPage';
import Footer from './components/Footer';
import { AppScreen } from './types';
import type { Task, ImageAnalysisObservation } from './types';
import { analyzeImageWithGemini, generateCleaningPlanWithGemini, generateCelebratoryMessageForTask } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { getDisplayTaskText } from './components/utils';

/**
 * Main application component.
 * Manages application state, including API key, current screen, tasks,
 * image analysis, loading/error states, and user settings (voice, gamification).
 * Handles core logic for image uploading, AI interaction for analysis and task generation,
 * task management (add, complete, reorder), and voice feedback.
 */
const App: React.FC = () => {
  // ------------- State Variables -------------
  /** @state {string | null} apiKey - The API key for Gemini AI services. */
  const [apiKey, setApiKey] = useState<string | null>(null);
  /** @state {AppScreen} currentScreen - The currently displayed screen in the application. */
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.Home);
  /** @state {string[] | null} uploadedImages - Array of base64 encoded uploaded image data URLs. Setter is used directly. */
  const [, setUploadedImages] = useState<string[] | null>(null);
  /** @state {ImageAnalysisObservation[]} imageAnalysis - Array of observations from AI image analysis. Setter is used directly. */
  const [, setImageAnalysis] = useState<ImageAnalysisObservation[]>([]);
  /** @state {Task[]} tasks - Array of tasks for the user to complete. */
  const [tasks, setTasks] = useState<Task[]>([]);
  /** @state {boolean} isLoading - Flag indicating if the application is currently in a loading state. */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /** @state {string | null} error - Error message string if an error occurs, null otherwise. */
  const [error, setError] = useState<string | null>(null);
  /** @state {number} currentTaskIndex - Index of the currently focused task in the `tasks` array. */
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  /** @state {string | null} draggingItemId - ID of the task item currently being dragged. */
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  /** @state {boolean} enableVoice - Flag to enable or disable voice assistance (text-to-speech). */
  const [enableVoice, setEnableVoice] = useState<boolean>(false);
  /** @state {boolean} enableGamification - Flag to enable or disable gamification features (e.g., streak counter). */
  const [enableGamification, setEnableGamification] = useState<boolean>(true);
  /** @state {number} streak - Current task completion streak for gamification. */
  const [streak, setStreak] = useState<number>(0);

  /** @state {string} lastCommandFeedback - Feedback message from voice commands (currently not fully implemented for input). */
  const [lastCommandFeedback, ] = useState<string>(''); // Setter not used yet, implies future use or removal.

  // ------------- General Callbacks -------------
  /**
   * Navigates to the image upload screen.
   * @callback
   */
  const handleLaunchCleaningTool = useCallback(() => {
    setCurrentScreen(AppScreen.ImageUpload);
  }, []);

  /**
   * Speaks the given text using browser's speech synthesis, if enabled.
   * @callback
   * @param {string} text - The text to be spoken.
   */
  const speak = useCallback((text: string) => {
    if (enableVoice && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [enableVoice]);

  // ------------- Task Management Callbacks -------------
  /**
   * Adds a new task to the task list.
   * @callback
   * @param {string} taskText - The text for the new task.
   */
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
    speak(`Added task: ${getDisplayTaskText(newTask.text)}`);
  }, [currentTaskIndex, speak]);

  /**
   * Generates an AI-powered celebratory message for a completed task and speaks it.
   * Falls back to a generic message if AI generation fails or is not available.
   * @callback
   * @param {string} taskText - The text of the completed task.
   */
  const generateAndSpeakAiCelebration = useCallback(async (taskText: string) => {
    let celebrationMessage = `Great job completing: ${getDisplayTaskText(taskText)}`;
    if (apiKey && taskText) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        // Pass the full taskText to the AI, as it might contain context beyond the display text (e.g. after '@')
        const aiCelebration = await generateCelebratoryMessageForTask(ai, taskText);
        if (aiCelebration) {
          celebrationMessage = aiCelebration;
        }
      } catch (e) {
        console.error("Failed to get AI celebratory message:", e);
        // Fallback to the generic message (already set) if AI fails.
      }
    }
    speak(celebrationMessage);
  }, [apiKey, speak]);

  /**
   * Finds the index of the next incomplete task in a given list of tasks,
   * starting the search after the `completedTaskId`.
   * @callback
   * @param {Task[]} updatedTasks - The array of tasks to search within.
   * @param {string} completedTaskId - The ID of the task that was just completed.
   * @returns {number} The index of the next incomplete task, or -1 if all are completed.
   */
  const findNextIncompleteTaskIndex = useCallback((updatedTasks: Task[], completedTaskId: string): number => {
    let searchStartIndex = updatedTasks.findIndex((task: Task) => task.id === completedTaskId);
    // Should not happen if called correctly, but provides a fallback.
    if (searchStartIndex === -1) searchStartIndex = 0;

    for (let i = 0; i < updatedTasks.length; i++) {
      const checkIndex = (searchStartIndex + 1 + i) % updatedTasks.length; // Wrap around search
      if (!updatedTasks[checkIndex].isCompleted) {
        return checkIndex;
      }
    }
    return -1; // All tasks are completed or no incomplete task found.
  }, []);

  /**
   * Handles the completion of a task.
   * Marks the task as completed, triggers a celebratory message,
   * updates gamification streaks, and navigates to the next task or completion screen.
   * @callback
   * @param {string} taskId - The ID of the task to be marked as complete.
   */
  const handleTaskComplete = useCallback(async (taskId: string) => {
    let completedTaskText = ""; // Store the text of the completed task for celebration.
    const updatedTasks = tasks.map((task: Task) => {
      if (task.id === taskId) {
        completedTaskText = task.text;
        return { ...task, isCompleted: true };
      }
      return task;
    });
    setTasks(updatedTasks);

    if (completedTaskText) {
      await generateAndSpeakAiCelebration(completedTaskText);
    }
    
    const allTasksNowCompleted = updatedTasks.every((task: Task) => task.isCompleted);

    if (allTasksNowCompleted) {
      speak("Fantastic! You've completed all tasks for this area!");
      if (enableGamification) {
        setStreak((s: number) => s + 1); // Increment streak
      }
      setCurrentScreen(AppScreen.AllTasksCompleted);
    } else {
      const nextIncompleteTaskIndex = findNextIncompleteTaskIndex(updatedTasks, taskId);
      
      if (nextIncompleteTaskIndex !== -1) {
        // Delay setting the next task to allow completion animation/feedback to be perceived.
        setTimeout(() => {
          setCurrentTaskIndex(nextIncompleteTaskIndex);
          // Speaking for the next task is handled by a separate useEffect hook.
        }, 500); 
      } else { 
        // This case should ideally be covered by `allTasksNowCompleted`,
        // but acts as a safeguard if somehow an incomplete task isn't found.
        speak("Looks like that was the last one! Amazing!");
        if (enableGamification) {
          setStreak((s: number) => s + 1);
        }
        setCurrentScreen(AppScreen.AllTasksCompleted);
      }
    }
  }, [tasks, apiKey, speak, enableGamification, generateAndSpeakAiCelebration, findNextIncompleteTaskIndex]);

  // ------------- Effects -------------
  /**
   * Effect to initialize the API key from environment variables on component mount.
   * Sets an error state if the API key is not found.
   */
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

  /**
   * Handles the image upload process.
   * Validates API key and image data, then calls AI services for image analysis and task plan generation.
   * Updates application state with results, loading status, and errors.
   * @callback
   * @param {string[]} imageDataUrls - An array of base64 encoded image data URLs.
   */
  const handleImageUpload = useCallback(async (imageDataUrls: string[]) => {
    if (!apiKey) {
      setError("API Key is not configured. Cannot proceed. Ensure VITE_GEMINI_API_KEY is set.");
      setCurrentScreen(AppScreen.Error);
      return;
    }
    if (imageDataUrls.length === 0) {
      setError("No images were provided for analysis.");
      // Consider returning to ImageUpload screen or showing a dismissible message
      return; 
    }

    setUploadedImages(imageDataUrls); // Store raw image data (setter only)
    setIsLoading(true);
    setError(null);
    setCurrentScreen(AppScreen.Processing);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const analysisResults = await analyzeImageWithGemini(ai, imageDataUrls);
      setImageAnalysis(analysisResults); // Store analysis results (setter only)

      if (analysisResults.length === 0) {
        setError("The AI could not identify actionable items from the image(s). Try a different view or image, or add tasks manually.");
        setCurrentScreen(AppScreen.ImageUpload); // Go back to allow new uploads or manual additions
        setUploadedImages(null); // Clear images
        setIsLoading(false);
        return;
      }

      const plan: Partial<Task>[] = await generateCleaningPlanWithGemini(ai, analysisResults);
      const tasksWithIds: Task[] = plan.map(taskDetails => ({
        id: uuidv4(),
        text: taskDetails.text || "Unnamed task from AI", // Provide clearer default
        isCompleted: false,
        estimatedTime: taskDetails.estimatedTime,
        difficulty: taskDetails.difficulty,
        prioritizationHint: taskDetails.prioritizationHint,
      }));

      setTasks(tasksWithIds);
      setCurrentTaskIndex(0); // Focus the first task
      setCurrentScreen(AppScreen.Tasks);
    } catch (err) {
      console.error("Error processing image(s) or generating plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during AI processing. Please try again.";
      setError(errorMessage);
      setCurrentScreen(AppScreen.Error); // Navigate to a generic error screen
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]); // Dependencies: only apiKey, as setters are stable.

  /**
   * Resets the application to the image upload screen, clearing current tasks and analysis.
   * @callback
   */
  const handleReset = () => {
    setUploadedImages(null);
    setImageAnalysis([]);
    setTasks([]);
    setError(null);
    setCurrentTaskIndex(0); // Reset task focus
    setCurrentScreen(AppScreen.ImageUpload);
    speak("Let's tackle a new area!");
  };
  
  /**
   * Effect to speak the current task when it changes or voice is enabled/disabled,
   * provided the current screen is the Tasks screen and the task is not completed.
   */
  useEffect(() => {
    if (enableVoice && currentScreen === AppScreen.Tasks && tasks.length > 0 && tasks[currentTaskIndex] && !tasks[currentTaskIndex].isCompleted) {
      speak(`Current task: ${getDisplayTaskText(tasks[currentTaskIndex].text)}`);
    }
  }, [currentTaskIndex, tasks, currentScreen, speak, enableVoice]); // speak is memoized

  /**
   * Handles reordering of tasks in the list via drag-and-drop.
   * Updates the tasks array and attempts to maintain the focused task's visibility.
   * @callback
   * @param {string} draggedTaskId - The ID of the task being dragged.
   * @param {string} targetTaskId - The ID of the task over which the dragged task is dropped.
   */
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
      return <MessageCard type="error" title="An Error Occurred" message={error} onDismiss={() => {setError(null); apiKey ? setCurrentScreen(AppScreen.ImageUpload) : setCurrentScreen(AppScreen.Welcome);}} />;
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
        return <LandingPage onLaunchCleaningTool={handleLaunchCleaningTool} />;
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
            <div className="text-center p-8 bg-white shadow-xl rounded-lg">
                <i className="fas fa-party-popper text-5xl text-[var(--warning-color)] mb-4 animate-bounce"></i>
                <h2 className="text-3xl font-bold text-[var(--success-color)] mb-3">All Done!</h2>
                <p className="text-lg text-[var(--text-primary)] mb-6">You've successfully cleared this area. Amazing work!</p>
                {enableGamification && <p className="text-xl text-[var(--primary-color)] font-semibold mb-6">Your cleaning streak: {streak} {streak > 0 ? '🎉' : ''}</p>}
                <button
                    onClick={handleReset}
                    className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
                >
                    Clean Another Area
                </button>
            </div>
        );
      default: 
        if (!apiKey) {
            return <LoadingSpinner message="Initializing..." />;
        }
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden bg-[var(--background-primary)] dark">
      <Header streak={enableGamification ? streak : undefined} />
      
      <main className="flex-grow">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>

      {/* Voice Command Feedback */}
      {lastCommandFeedback && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[var(--primary-color)] text-white px-6 py-3 rounded-full shadow-lg animate-fade-in-out">
          <div className="flex items-center gap-2">
            <i className="fas fa-microphone-alt"></i>
            <span>{lastCommandFeedback}</span>
          </div>
        </div>
      )}

      <SettingsPanel
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
