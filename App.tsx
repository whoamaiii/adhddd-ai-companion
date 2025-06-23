import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { TaskList } from './components/TaskList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SettingsPanel } from './components/SettingsPanel';
import { MessageCard } from './components/MessageCard';
import { LiveAudioBodyDoubleWrapper } from './components/LiveAudioBodyDoubleWrapper'; // Import wrapper
import { AppScreen } from './types';
import type { Task, ImageAnalysisObservation, GeminiTaskResponseItem } from './types';
import { analyzeImageWithGemini, generateCleaningPlanWithGemini, generateCelebratoryMessageForTask } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.Welcome);
  const [uploadedImages, setUploadedImages] = useState<string[] | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisObservation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const [enableVoice, setEnableVoice] = useState<boolean>(false);
  const [enableGamification, setEnableGamification] = useState<boolean>(true);
  const [streak, setStreak] = useState<number>(0);

  // States for Live Audio Body Double
  const [isBodyDoubleActive, setIsBodyDoubleActive] = useState<boolean>(false);
  const [showBodyDoubleUI, setShowBodyDoubleUI] = useState<boolean>(false);
  const [lastCommandFeedback, setLastCommandFeedback] = useState<string>('');
  const [enableAmbientSound, setEnableAmbientSound] = useState<boolean>(() => {
    const saved = localStorage.getItem('enableAmbientSound');
    return saved ? saved === 'true' : false;
  });

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

  const handleTaskComplete = useCallback(async (taskId: string) => {
    let completedTaskTextForAISpeech = "";
    const updatedTasks = tasks.map((task: Task) => {
      if (task.id === taskId) {
        completedTaskTextForAISpeech = task.text;
        return { ...task, isCompleted: true };
      }
      return task;
    });
    setTasks(updatedTasks);

    // AI Celebration message
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
        // Fallback to generic message is already set
      }
    }
    speak(celebrationMessage);
    
    const allTasksNowCompleted = updatedTasks.every((task: Task) => task.isCompleted);

    if (allTasksNowCompleted) {
        speak("Fantastic! You've completed all tasks for this area!");
        if (enableGamification) {
            setStreak((s: number) => s + 1);
        }
        setCurrentScreen(AppScreen.AllTasksCompleted);
    } else {
      let nextIncompleteTaskIndex = -1;
      let searchStartIndex = tasks.findIndex((task: Task) => task.id === taskId);
      if (searchStartIndex === -1) searchStartIndex = 0;

      for (let i = 0; i < updatedTasks.length; i++) {
        const checkIndex = (searchStartIndex + 1 + i) % updatedTasks.length;
        if (!updatedTasks[checkIndex].isCompleted) {
            nextIncompleteTaskIndex = checkIndex;
            break;
        }
      }
      
      if (nextIncompleteTaskIndex !== -1) {
        setTimeout(() => {
          setCurrentTaskIndex(nextIncompleteTaskIndex);
          // Speak for next task is handled by useEffect
        }, 500); 
      } else { 
        speak("Looks like that was the last one! Amazing!");
         if (enableGamification) {
            setStreak((s: number) => s + 1);
        }
        setCurrentScreen(AppScreen.AllTasksCompleted);
      }
    }
  }, [tasks, speak, enableGamification, apiKey]);

  // Handle voice commands from LiveAudioBodyDouble
  const handleVoiceCommand = useCallback((event: CustomEvent) => {
    const { command, parameters } = event.detail;
    const action = command.action;
    
    // Visual feedback for command execution
    setLastCommandFeedback(`Executing: ${command.description}`);
    setTimeout(() => setLastCommandFeedback(''), 3000);
    
    switch (action) {
      case 'COMPLETE_CURRENT_TASK':
        if (tasks.length > 0 && currentTaskIndex >= 0 && currentTaskIndex < tasks.length) {
          const currentTask = tasks[currentTaskIndex];
          if (!currentTask.isCompleted) {
            handleTaskComplete(currentTask.id);
            speak('Task completed!');
          } else {
            speak('This task is already completed.');
          }
        } else {
          speak('No task to complete.');
        }
        break;
        
      case 'NEXT_TASK':
        if (tasks.length > 0) {
          const nextIncompleteIndex = tasks.findIndex((task, index) => 
            index > currentTaskIndex && !task.isCompleted && !task.isDeferred
          );
          if (nextIncompleteIndex !== -1) {
            setCurrentTaskIndex(nextIncompleteIndex);
            speak(`Next task: ${tasks[nextIncompleteIndex].text.split('@')[0].trim()}`);
          } else {
            // Wrap around to find first incomplete non-deferred task
            const firstIncompleteIndex = tasks.findIndex(task => !task.isCompleted && !task.isDeferred);
            if (firstIncompleteIndex !== -1 && firstIncompleteIndex !== currentTaskIndex) {
              setCurrentTaskIndex(firstIncompleteIndex);
              speak(`Next task: ${tasks[firstIncompleteIndex].text.split('@')[0].trim()}`);
            } else {
              speak('No more incomplete tasks.');
            }
          }
        } else {
          speak('No tasks available.');
        }
        break;
        
      case 'PREVIOUS_TASK':
        if (tasks.length > 0 && currentTaskIndex > 0) {
          const prevIndex = currentTaskIndex - 1;
          setCurrentTaskIndex(prevIndex);
          speak(`Previous task: ${tasks[prevIndex].text.split('@')[0].trim()}`);
        } else if (currentTaskIndex === 0) {
          speak('Already at the first task.');
        } else {
          speak('No tasks available.');
        }
        break;
        
      case 'ADD_TASK':
        if (parameters?.taskTitle) {
          handleAddTask(parameters.taskTitle);
        } else {
          // Show add task dialog or prompt
          speak('What task would you like to add?');
          // You might want to trigger the add task UI here
        }
        break;
        
      case 'SKIP_TASK':
        if (tasks.length > 0 && currentTaskIndex >= 0 && currentTaskIndex < tasks.length) {
          const currentTask = tasks[currentTaskIndex];
          if (!currentTask.isCompleted) {
            // Mark as deferred by updating the task
            const updatedTasks = tasks.map(task => {
              if (task.id === currentTask.id) {
                return { ...task, isDeferred: true }; // You may need to add this property to Task type
              }
              return task;
            });
            setTasks(updatedTasks);
            speak('Task skipped. Moving to next task.');
            
            // Move to next incomplete and non-deferred task
            const nextIncompleteIndex = tasks.findIndex((task, index) => 
              index > currentTaskIndex && !task.isCompleted && !task.isDeferred
            );
            if (nextIncompleteIndex !== -1) {
              setCurrentTaskIndex(nextIncompleteIndex);
            } else {
              // Wrap around to find first incomplete non-deferred task
              const firstIncompleteIndex = tasks.findIndex(task => !task.isCompleted && !task.isDeferred);
              if (firstIncompleteIndex !== -1 && firstIncompleteIndex !== currentTaskIndex) {
                setCurrentTaskIndex(firstIncompleteIndex);
              }
            }
          } else {
            speak('This task is already completed.');
          }
        } else {
          speak('No task to skip.');
        }
        break;
        
      case 'START_SESSION':
      case 'START_CLEANING':
        if (currentScreen !== AppScreen.ImageUpload) {
          setCurrentScreen(AppScreen.ImageUpload);
          speak('Ready to start cleaning! Please upload an image of the area.');
        } else {
          speak('Already on the image upload screen.');
        }
        break;
        
      case 'QUERY_PROGRESS':
      case 'CHECK_PROGRESS':
        if (tasks.length > 0) {
          const completedCount = tasks.filter(t => t.isCompleted).length;
          const totalCount = tasks.length;
          const percentage = Math.round((completedCount / totalCount) * 100);
          speak(`You've completed ${completedCount} out of ${totalCount} tasks. That's ${percentage} percent! ${completedCount > 0 ? 'Great progress!' : 'Let\'s get started!'}`);
        } else {
          speak('No tasks to track progress on yet.');
        }
        break;
        
      case 'QUERY_NEXT_TASK':
        if (tasks.length > 0 && currentTaskIndex >= 0 && currentTaskIndex < tasks.length) {
          const currentTask = tasks[currentTaskIndex];
          if (!currentTask.isCompleted) {
            speak(`Your current task is: ${currentTask.text.split('@')[0].trim()}`);
          } else {
            const nextIncompleteIndex = tasks.findIndex((task, index) => 
              index > currentTaskIndex && !task.isCompleted
            );
            if (nextIncompleteIndex !== -1) {
              speak(`Your next task is: ${tasks[nextIncompleteIndex].text.split('@')[0].trim()}`);
            } else {
              speak('All tasks are completed!');
            }
          }
        } else {
          speak('No tasks available.');
        }
        break;
        
      case 'QUERY_TASK_COUNT':
        if (tasks.length > 0) {
          const remainingCount = tasks.filter(t => !t.isCompleted && !t.isDeferred).length;
          const deferredCount = tasks.filter(t => t.isDeferred).length;
          let message = `You have ${remainingCount} ${remainingCount === 1 ? 'task' : 'tasks'} remaining`;
          if (deferredCount > 0) {
            message += ` and ${deferredCount} deferred ${deferredCount === 1 ? 'task' : 'tasks'}`;
          }
          speak(message + '.');
        } else {
          speak('No tasks in your list.');
        }
        break;
        
      case 'NAVIGATE_HOME':
        setCurrentScreen(AppScreen.ImageUpload);
        speak('Navigating to home screen.');
        break;
        
      case 'NAVIGATE_TASKS':
        if (tasks.length > 0) {
          setCurrentScreen(AppScreen.Tasks);
          speak('Here are your tasks.');
        } else {
          speak('No tasks available. Upload an image first.');
        }
        break;
        
      case 'TOGGLE_VOICE':
        setEnableVoice(!enableVoice);
        if (!enableVoice) {
          speak('Voice assistance enabled.');
        }
        break;
        
      case 'TOGGLE_AMBIENT_SOUND':
        setEnableAmbientSound(prev => !prev);
        speak(enableAmbientSound ? 'Ambient sounds disabled.' : 'Ambient sounds enabled.');
        break;
        
      default:
        console.log(`Unhandled voice command: ${action}`);
        speak('Sorry, I didn\'t understand that command.');
    }
  }, [tasks, currentTaskIndex, currentScreen, enableVoice, enableAmbientSound, speak, handleTaskComplete, handleAddTask]);

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceCommandEvent = (event: Event) => {
      handleVoiceCommand(event as CustomEvent);
    };
    
    window.addEventListener('voice-command', handleVoiceCommandEvent);
    
    return () => {
      window.removeEventListener('voice-command', handleVoiceCommandEvent);
    };
  }, [handleVoiceCommand]);

  // Save ambient sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('enableAmbientSound', String(enableAmbientSound));
  }, [enableAmbientSound]);

  useEffect(() => {
    const keyFromEnv = import.meta.env.VITE_GEMINI_API_KEY;
    if (keyFromEnv) {
      setApiKey(keyFromEnv);
      setCurrentScreen(AppScreen.ImageUpload); 
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
    <div className="min-h-screen flex flex-col items-center p-4 selection:bg-sky-200 selection:text-sky-900" style={{backgroundColor: 'var(--bg-page)'}}>
      <Header title="ADHD Cleaning Companion" streak={enableGamification ? streak : undefined} />
      <main className="container mx-auto mt-2 md:mt-6 p-0 md:p-2 bg-[var(--bg-card)] rounded-xl shadow-xl w-full max-w-2xl mb-24">
        {renderContent()}
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

      {/* Live Audio Body Double Floating Panel */}
      {showBodyDoubleUI && apiKey && (
        <div 
          className="fixed bottom-24 left-4 z-40 bg-[var(--bg-card)] p-3 md:p-4 rounded-xl shadow-2xl border border-[var(--border-light)] w-auto min-w-[280px]"
          // Increased bottom margin to avoid overlapping settings panel potentially
        >
          <LiveAudioBodyDoubleWrapper 
            apiKey={apiKey} 
            isActive={isBodyDoubleActive} 
          />
        </div>
      )}

      <SettingsPanel
        enableVoice={enableVoice}
        onToggleVoice={() => {
            const newVoiceState = !enableVoice;
            setEnableVoice(newVoiceState);
            setTimeout(() => { // Ensure state update before speaking
                if (newVoiceState) speak("Voice assistance enabled.");
                else { if (window.speechSynthesis) window.speechSynthesis.cancel(); } 
            }, 0);
        }}
        enableGamification={enableGamification}
        onToggleGamification={() => setEnableGamification(g => !g)}
        enableBodyDouble={isBodyDoubleActive} // Pass current state
        onToggleBodyDouble={() => {
          const newActiveState = !isBodyDoubleActive;
          setIsBodyDoubleActive(newActiveState); // Update active state immediately
          if (newActiveState) {
            setShowBodyDoubleUI(true); // Show UI immediately when activating
          } else {
            // Delay hiding UI to allow Lit component to process isActive=false prop
            // and potentially run its deactivation/cleanup logic
            setTimeout(() => setShowBodyDoubleUI(false), 100); 
          }
        }}
        enableAmbientSound={enableAmbientSound}
        onToggleAmbientSound={() => setEnableAmbientSound(s => !s)}
      />
      <footer className="text-center text-[var(--text-secondary)] mt-8 text-sm pb-4">
        <p>&copy; {new Date().getFullYear()} AI Cleaning Assistant. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
