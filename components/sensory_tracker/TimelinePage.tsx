import React, { useState, useMemo } from 'react';
import type { SensoryMoment } from '../../types';
import SensorySettings from './SensorySettings';

// Constants for tags to avoid re-calculating them on every render
const BEHAVIOR_TAGS = ["Stimming", "Vocalizing", "Withdrawing", "Seeking Pressure", "Covering Ears", "Fidgeting"];
const ENVIRONMENT_TAGS = ["Loud Noises", "Bright Lights", "Crowded", "Strong Smells", "New Place", "Transitioning"];

interface TimelinePageProps {
  moments: SensoryMoment[];
  customBehaviors: string[];
  customEnvironments: string[];
  onAddCustomTag: (tag: string, type: 'behavior' | 'environment') => void;
  onDeleteCustomTag: (tag: string, type: 'behavior' | 'environment') => void;
}

// --- Helper Components ---

/**
 * A card component that displays a single sensory moment.
 */
const MomentCard: React.FC<{ moment: SensoryMoment }> = ({ moment }) => {
  const getStateColor = (state: number): string => {
    if (state <= 2) return 'var(--state-calm)';
    if (state === 3) return 'var(--state-neutral)';
    return 'var(--state-overwhelmed)';
  };
  const stateColor = getStateColor(moment.overallState);

  const formatTimestamp = (timestamp: number): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="card-base p-4 interactive-item">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {new Date(moment.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {formatTimestamp(moment.timestamp)}
          </p>
        </div>
        <div 
          className="w-3 h-3 rounded-full mt-1"
          style={{ 
            backgroundColor: stateColor, 
            boxShadow: `0 0 8px ${stateColor}` 
          }}
          title={`Overall State: ${moment.overallState}`}
        />
      </div>
      {moment.behaviors.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Behaviors</h3>
          <div className="flex flex-wrap gap-2">
            {moment.behaviors.map((tag, index) => (
              <span key={`${tag}-${index}`} className="tag-pill text-white" style={{ backgroundColor: 'var(--tag-behavior)' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
      {moment.environment.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Environment</h3>
          <div className="flex flex-wrap gap-2">
            {moment.environment.map((tag, index) => (
              <span key={`${tag}-${index}`} className="tag-pill text-white" style={{ backgroundColor: 'var(--tag-environment)' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
      {moment.contextNote && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Context</h3>
          <p className="text-sm text-[var(--text-secondary)] italic">"{moment.contextNote}"</p>
        </div>
      )}
    </div>
  );
};

/**
 * The main timeline page component for displaying sensory moments with filtering capabilities.
 */
const TimelinePage: React.FC<TimelinePageProps> = ({ 
  moments,
  customBehaviors,
  customEnvironments,
  onAddCustomTag,
  onDeleteCustomTag
}) => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);

  // Filtering and sorting logic
  const filteredAndSortedMoments = useMemo(() => {
    return moments
      .filter(moment => {
        const behaviorMatch = selectedBehaviors.length === 0 || selectedBehaviors.every(b => moment.behaviors.includes(b));
        const environmentMatch = selectedEnvironments.length === 0 || selectedEnvironments.every(e => moment.environment.includes(e));
        return behaviorMatch && environmentMatch;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [moments, selectedBehaviors, selectedEnvironments]);

  const handleTagToggle = (tag: string, type: 'behavior' | 'environment') => {
    const state = type === 'behavior' ? selectedBehaviors : selectedEnvironments;
    const setState = type === 'behavior' ? setSelectedBehaviors : setSelectedEnvironments;
    
    if (state.includes(tag)) {
      setState(state.filter(t => t !== tag));
    } else {
      setState([...state, tag]);
    }
  };

  const handleResetFilters = () => {
    setSelectedBehaviors([]);
    setSelectedEnvironments([]);
  };

  const openSettings = () => {
    setIsFilterVisible(false);
    setIsSettingsVisible(true);
  }

  const openFilters = () => {
    setIsSettingsVisible(false);
    setIsFilterVisible(prev => !prev);
  }

  const closePanels = () => {
    setIsFilterVisible(false);
    setIsSettingsVisible(false);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.32))] bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-transparent backdrop-blur-sm">
        <div className="w-20"></div>
        <h1 className="text-xl font-bold flex-1 text-center">Timeline</h1>
        <div className="flex items-center justify-end w-20">
          <button onClick={openSettings} className="p-2 rounded-full hover:bg-[var(--surface-secondary)] transition-colors">
            <span className="material-icons-outlined">settings</span>
          </button>
          <button onClick={openFilters} className="p-2 rounded-full hover:bg-[var(--surface-secondary)] transition-colors">
            <span className="material-icons-outlined">{isFilterVisible ? 'close' : 'filter_list'}</span>
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {isSettingsVisible && (
        <SensorySettings 
          moments={moments} 
          onClose={() => setIsSettingsVisible(false)}
          customBehaviors={customBehaviors}
          customEnvironments={customEnvironments}
          onAddTag={onAddCustomTag}
          onDeleteTag={onDeleteCustomTag}
        />
      )}

      {/* Filter Panel */}
      {isFilterVisible && (
        <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--surface-primary)]">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Filter by Behavior</h3>
            <div className="flex flex-wrap gap-2">
              {BEHAVIOR_TAGS.map(tag => (
                <button key={tag} onClick={() => handleTagToggle(tag, 'behavior')} className={`tag-pill transition-all ${selectedBehaviors.includes(tag) ? 'bg-[var(--tag-behavior)] text-white ring-2 ring-white/50' : 'bg-[var(--surface-secondary)] hover:bg-[var(--tag-behavior)]/50'}`}>{tag}</button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Filter by Environment</h3>
            <div className="flex flex-wrap gap-2">
              {ENVIRONMENT_TAGS.map(tag => (
                <button key={tag} onClick={() => handleTagToggle(tag, 'environment')} className={`tag-pill transition-all ${selectedEnvironments.includes(tag) ? 'bg-[var(--tag-environment)] text-white ring-2 ring-white/50' : 'bg-[var(--surface-secondary)] hover:bg-[var(--tag-environment)]/50'}`}>{tag}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
             <button onClick={handleResetFilters} className="flex-1 py-2 text-sm bg-[var(--surface-secondary)] rounded-lg hover:bg-opacity-80">Reset</button>
             <button onClick={() => setIsFilterVisible(false)} className="flex-1 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-80">Apply</button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 overflow-y-auto space-y-4 pb-24">
        {filteredAndSortedMoments.length > 0 ? (
          filteredAndSortedMoments.map(moment => <MomentCard key={moment.id} moment={moment} />)
        ) : (
          <div className="text-center text-[var(--text-secondary)] pt-16 flex flex-col items-center justify-center">
            <span className="material-icons-outlined text-6xl mb-4">{moments.length === 0 ? 'history' : 'manage_search'}</span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              {moments.length === 0 ? "No Moments Logged" : "No Matching Moments"}
            </h2>
            <p>
              {moments.length === 0 ? "Your logged moments will appear here." : "Try adjusting your filters to find what you're looking for."}
            </p>
            {moments.length > 0 && (
                <button onClick={handleResetFilters} className="mt-4 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-semibold">Reset Filters</button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TimelinePage;