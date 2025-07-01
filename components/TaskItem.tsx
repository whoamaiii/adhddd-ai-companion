import React, { useState } from 'react';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  isCurrent: boolean;
  onComplete: () => void;
  onFocus: () => void;
  onReorder: (draggedTaskId: string, targetTaskId: string) => void;
  draggingItemId: string | null;
  onDragStartInternal: (taskId: string) => void;
  onDragEndInternal: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isCurrent, 
  onComplete, 
  onFocus,
  onReorder,
  draggingItemId,
  onDragStartInternal,
  onDragEndInternal
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Constants for task difficulty to avoid magic strings in styling
  const TASK_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
  };

  let mainTaskText = task.text;
  let locationText: string | null = null;
  const parts = task.text.split('@');
  if (parts.length > 1) {
    mainTaskText = parts[0].trim();
    locationText = parts.slice(1).join('@').trim();
  }

  const isBeingDragged = draggingItemId === task.id;

  const itemClasses = `
    p-3 md:p-4 rounded-xl shadow-sm border transition-all duration-300 ease-in-out flex items-start gap-3 md:gap-4 
    ${/* Base styling based on completion or deferred status */''}
    ${task.isCompleted 
      ? 'bg-[var(--success-bg-light)] border-[var(--success-color)] opacity-80' // Completed task style
      : task.isDeferred
      ? 'bg-gray-50 border-gray-300 opacity-60' // Deferred task style
      : 'bg-[var(--bg-card)] border-[var(--border-light)] hover:shadow-md' // Default active task style
    }
    ${/* Styling for the current, non-completed, non-deferred task */''}
    ${isCurrent && !task.isCompleted && !task.isDeferred
      ? 'ring-2 ring-[var(--primary-color)] scale-102 shadow-lg border-transparent' 
      : ''
    }
    ${/* Cursor style based on draggable state */''}
    ${!task.isCompleted && !task.isDeferred ? 'cursor-grab' : 'cursor-default'}
    ${/* Styling when the item is being dragged */''}
    ${isBeingDragged ? 'opacity-50 border-dashed border-[var(--primary-color)]' : ''}
    ${/* Styling when a draggable item is over this item (as a drop target) */''}
    ${isDragOver && !isBeingDragged && !task.isCompleted && !task.isDeferred ? 'border-t-2 border-t-[var(--primary-color)] border-b-transparent border-x-transparent shadow-none scale-100' : ''}
    ${/* Additional class for deferred tasks if specific global styles target it */''}
    ${task.isDeferred ? 'task-deferred' : ''}
  `;
  
  const iconContainerBase = "flex items-center justify-center rounded-full shrink-0 size-8 md:size-10 mt-1"; // Added mt-1 for better alignment with multi-line text
  
  let iconContainerDynamicClasses = "";
  let iconElement: React.ReactNode = null;

  if (task.isCompleted) {
    iconContainerDynamicClasses = `${iconContainerBase} bg-[var(--success-color)] text-white`;
    iconElement = <i className="fas fa-check text-sm md:text-base"></i>;
  } else if (task.isDeferred) {
    iconContainerDynamicClasses = `${iconContainerBase} bg-gray-400 text-white`;
    iconElement = <i className="fas fa-forward text-sm md:text-base"></i>;
  } else if (isCurrent) {
    iconContainerDynamicClasses = `${iconContainerBase} bg-[var(--primary-color)] text-white`;
    iconElement = <i className="fas fa-arrow-right text-sm md:text-base"></i>;
  } else { 
    iconContainerDynamicClasses = `${iconContainerBase} border-2 border-[var(--primary-color)] bg-transparent`;
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.isCompleted || task.isDeferred) return;
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStartInternal(task.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.isCompleted || draggingItemId === task.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.isCompleted || draggingItemId === task.id) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.isCompleted || draggingItemId === task.id) return;
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
    }
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.isCompleted) return;
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== task.id) {
      onReorder(draggedId, task.id);
    }
    setIsDragOver(false);
    onDragEndInternal();
  };

  const handleDragEnd = () => {
    if (task.isCompleted) return;
    setIsDragOver(false);
    onDragEndInternal();
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onFocus from firing when clicking expand
    setIsExpanded(!isExpanded);
  };

  // Check if text is likely to overflow to determine if "Show more" is needed
  // This is a simple heuristic; true overflow detection is complex without rendering.
  // We'll show it if the text has more than, say, 70 characters (approx 2 lines) and not expanded.
  const needsExpansionToggle = !isExpanded && mainTaskText.length > 70;


  return (
    <div 
      className={itemClasses} 
      onClick={!task.isCompleted ? onFocus : undefined} 
      role="listitem" 
      aria-current={isCurrent && !task.isCompleted ? "step" : undefined}
      draggable={!task.isCompleted}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      title={!task.isCompleted ? "Click to focus, or drag to reorder" : ""}
    >
      <div className={iconContainerDynamicClasses}>
        {iconElement}
      </div>

      <div className="flex-grow min-w-0">
        <p 
            className={`text-[var(--text-primary)] text-sm md:text-base ${isCurrent && !task.isCompleted ? 'font-semibold': 'font-medium'} leading-normal ${task.isCompleted ? 'line-through text-[var(--text-secondary)]' : ''} ${!isExpanded ? 'line-clamp-2' : ''}`}
        >
          {mainTaskText}
        </p>
        {(needsExpansionToggle || isExpanded) && !task.isCompleted && (
          <button 
            onClick={handleToggleExpand} 
            className="text-xs text-[var(--primary-color)] hover:underline mt-1 font-medium flex items-center"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Show less" : "Show more"}
            <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} ml-1 text-xs`}></i>
          </button>
        )}

        {locationText && !task.isCompleted && (
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-normal leading-normal mt-0.5">{locationText}</p>
        )}
         {task.isCompleted && locationText && (
          <p className="text-slate-400 text-xs md:text-sm font-normal leading-normal line-through mt-0.5">{locationText}</p>
        )}

        {/* Difficulty, Time, Hint */}
        {!task.isCompleted && (task.difficulty || task.estimatedTime || task.prioritizationHint) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                {task.difficulty && (
                    <span 
                        className={`px-2 py-0.5 rounded-full font-medium text-white text-xs
                            ${task.difficulty === TASK_DIFFICULTY.EASY ? 'bg-green-500' : ''}
                            ${task.difficulty === TASK_DIFFICULTY.MEDIUM ? 'bg-yellow-500' : ''}
                            ${task.difficulty === TASK_DIFFICULTY.HARD ? 'bg-orange-500' : ''}
                        `}
                    >
                        {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                    </span>
                )}
                {task.estimatedTime && (
                    <span className="text-[var(--text-secondary)] flex items-center">
                        <i className="far fa-clock mr-1"></i>
                        {task.estimatedTime}
                    </span>
                )}
                {task.prioritizationHint && (
                     <span className="text-sky-600 flex items-center" title={task.prioritizationHint}>
                        <i className="far fa-lightbulb mr-1"></i>
                        {task.prioritizationHint}
                    </span>
                )}
            </div>
        )}
      </div>

      {!task.isCompleted && !task.isDeferred && (
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            onComplete();
          }}
          className={`font-semibold py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm transition-colors duration-150 flex-shrink-0 flex items-center gap-1 self-start mt-1
            ${isCurrent ? 'bg-[var(--success-color)] text-white hover:opacity-90' : 'bg-slate-100 text-[var(--text-secondary)] hover:bg-slate-200 hover:text-[var(--text-primary)] border border-[var(--border-medium)]'}`}
          aria-label={`Mark task as complete: ${mainTaskText}`}
        >
          <i className="fas fa-check"></i> Done
        </button>
      )}
      {task.isDeferred && (
        <div className="text-gray-500 text-xs md:text-sm flex-shrink-0 mt-1 self-start font-medium">
          <i className="fas fa-clock"></i> Deferred
        </div>
      )}
      {task.isCompleted && (
         <div className="text-[var(--success-color)] text-xl md:text-2xl flex-shrink-0 opacity-70 mt-1 self-start">
          <i className="fas fa-check-circle"></i>
        </div>
      )}
    </div>
  );
};
