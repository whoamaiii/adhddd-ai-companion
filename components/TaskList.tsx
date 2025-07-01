
import React, { useState, useCallback } from 'react';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  currentTaskIndex: number;
  onTaskComplete: (taskId: string) => void;
  onFocusTask: (index: number) => void;
  onTaskReorder: (draggedTaskId: string, targetTaskId: string) => void;
  draggingItemId: string | null;
  onTaskDragStart: (taskId: string) => void;
  onTaskDragEnd: () => void;
  onAddTask: (taskText: string) => void;
  agentSuggestions?: string[];
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  currentTaskIndex, 
  onTaskComplete, 
  onFocusTask,
  onTaskReorder,
  draggingItemId,
  onTaskDragStart,
  onTaskDragEnd,
  onAddTask,
  agentSuggestions
}) => {
  const [showAddTaskInput, setShowAddTaskInput] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const handleSaveNewTask = useCallback(() => {
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim());
      setNewTaskText("");
      setShowAddTaskInput(false);
    }
  }, [newTaskText, onAddTask]);

  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-2 md:p-4">
      <div className="px-2 md:px-0">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[var(--text-primary)] text-sm font-medium">Overall Progress</p>
          <p className="text-[var(--success-color)] text-sm font-semibold">{progressPercentage}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--progress-bar-background)] overflow-hidden shadow-inner mb-1">
          <div 
            className="h-full rounded-full bg-[var(--success-color)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label="Cleaning progress"
          ></div>
        </div>
        <p className="text-[var(--text-secondary)] text-xs font-normal leading-normal text-right">{completedTasks} of {totalTasks} tasks completed</p>
      </div>

      {/* Agent Suggestions */}
      {agentSuggestions && agentSuggestions.length > 0 && (
        <div className="mt-4 p-4 bg-[var(--surface-primary)] rounded-lg border border-[var(--border-light)] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-outlined text-[var(--accent-primary)] text-xl">auto_awesome</span>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant Suggestions</h3>
          </div>
          <div className="space-y-2">
            {agentSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 pb-4 text-left px-2 md:px-0">
        <h2 className="text-[var(--text-primary)] text-xl md:text-2xl font-bold leading-tight tracking-tight">
          Your Cleaning Plan
        </h2>
        <button
            onClick={() => setShowAddTaskInput(s => !s)}
            className="text-sm font-medium text-[var(--primary-color)] hover:text-[var(--secondary-color)] py-1 px-2 rounded-md hover:bg-sky-100 transition-colors flex items-center gap-1"
            title={showAddTaskInput ? "Cancel adding task" : "Add a custom task"}
        >
            <i className={`fas ${showAddTaskInput ? 'fa-times' : 'fa-plus-circle'}`}></i>
            {showAddTaskInput ? 'Cancel' : 'Add Task'}
        </button>
      </div>
      
      {showAddTaskInput && (
        <div className="mb-4 p-3 bg-sky-50 rounded-lg border border-sky-200 shadow-sm px-2 md:px-0">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Enter your custom task..."
            className="w-full p-2 border border-[var(--border-medium)] rounded-md mb-2 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] text-sm"
            aria-label="New task description"
          />
          <button
            onClick={handleSaveNewTask}
            disabled={!newTaskText.trim()}
            className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm disabled:bg-slate-300"
          >
            Save Task
          </button>
        </div>
      )}
      
      {tasks.length === 0 && !showAddTaskInput && (
         <p className="text-[var(--text-secondary)] text-center py-8">No tasks yet. Add one above or upload images for an AI plan!</p>
      )}

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            isCurrent={index === currentTaskIndex && !task.isCompleted}
            onComplete={() => onTaskComplete(task.id)}
            onFocus={() => { if(!task.isCompleted) onFocusTask(index);}}
            onReorder={onTaskReorder}
            draggingItemId={draggingItemId}
            onDragStartInternal={onTaskDragStart}
            onDragEndInternal={onTaskDragEnd}
          />
        ))}
      </div>

      {completedTasks === totalTasks && totalTasks > 0 && !showAddTaskInput && (
        <div className="text-center mt-8 p-4 bg-[var(--success-bg-light)] rounded-lg">
          <i className="fas fa-check-circle text-3xl text-[var(--success-color)] mb-2"></i>
          <p className="text-[var(--success-color)] font-semibold text-lg">
            All tasks for this area are complete! Well done!
          </p>
        </div>
      )}
    </div>
  );
};
