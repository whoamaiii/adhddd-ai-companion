import React, { useState } from 'react';
import type { SensoryMoment } from '../../types';

// Constants for tags and icons to keep the component clean.
const BEHAVIOR_TAGS = ["Stimming", "Vocalizing", "Withdrawing", "Seeking Pressure", "Covering Ears", "Fidgeting"];
const ENVIRONMENT_TAGS = ["Loud Noises", "Bright Lights", "Crowded", "Strong Smells", "New Place", "Transitioning"];

const iconMap: { [key: string]: string } = {
  "Stimming": "auto_awesome",
  "Vocalizing": "chat_bubble_outline",
  "Withdrawing": "north_west",
  "Seeking Pressure": "hugging",
  "Covering Ears": "hearing_disabled",
  "Fidgeting": "waving_hand",
  "Loud Noises": "campaign",
  "Bright Lights": "light_mode",
  "Crowded": "groups",
  "Strong Smells": "air",
  "New Place": "location_on",
  "Transitioning": "arrow_forward",
};

interface LogMomentPageProps {
  onSaveMoment: (moment: Omit<SensoryMoment, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}

/**
 * A screen for users to log their sensory experiences. It features a form with
 * selectable tags for behaviors and environments, a slider for overall state,
 * and an optional notes field. It's designed to be intuitive and mobile-first.
 *
 * @param {LogMomentPageProps} props - The component props.
 * @param props.onSaveMoment - Callback function to save the logged moment.
 * @param props.onCancel - Callback function to cancel the logging process.
 */
export const LogMomentPage = ({ onSaveMoment, onCancel }: LogMomentPageProps) => {
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [overallState, setOverallState] = useState<number>(3);
  const [contextNote, setContextNote] = useState('');

  const handleTagToggle = (tag: string, type: 'behavior' | 'environment') => {
    const state = type === 'behavior' ? selectedBehaviors : selectedEnvironments;
    const setState = type === 'behavior' ? setSelectedBehaviors : setSelectedEnvironments;
    
    if (state.includes(tag)) {
      setState(state.filter(t => t !== tag));
    } else {
      setState([...state, tag]);
    }
  };

  const handleSave = () => {
    onSaveMoment({
      behaviors: selectedBehaviors,
      environment: selectedEnvironments,
      overallState: overallState,
      contextNote: contextNote,
    });
  };

  /**
   * Renders a single selectable tag button.
   * This abstracts the button logic for both behaviors and environments.
   * @param {string} tag - The text content of the tag.
   * @param {'behavior' | 'environment'} type - The category of the tag.
   * @returns {React.ReactElement} The rendered button element.
   */
  const renderTag = (tag: string, type: 'behavior' | 'environment') => {
    const isSelected = type === 'behavior' ? selectedBehaviors.includes(tag) : selectedEnvironments.includes(tag);
    
    // Dynamically determine the color based on the tag type for a consistent theme.
    const baseColorVar = `var(--tag-${type})`;
    
    const classes = [
      'group', 'relative', 'p-3', 'sm:p-4', 'rounded-2xl',
      'flex', 'flex-col', 'items-center', 'justify-center', 'aspect-square',
      'border-2', 'transition-all', 'duration-200', 'transform', 'active:scale-90',
      isSelected
        ? `bg-[${baseColorVar}] text-white border-[${baseColorVar}] scale-95 shadow-lg`
        : `bg-[var(--surface-primary)] border-[var(--border-primary)] hover:border-[${baseColorVar}] hover:bg-[var(--surface-secondary)]`
    ].join(' ');

    return (
      <button 
        key={tag} 
        onClick={() => handleTagToggle(tag, type)} 
        className={classes}
      >
        <span className={`material-icons-outlined text-3xl sm:text-4xl mb-2 transition-colors ${isSelected ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{iconMap[tag]}</span>
        <span className="text-xs sm:text-sm font-semibold text-center">{tag}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.32))] bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-transparent backdrop-blur-sm">
        <h1 className="text-xl font-bold">Log a Moment</h1>
        <button onClick={onCancel} className="text-lg font-semibold text-[var(--accent-primary)] hover:opacity-80 transition-opacity">Cancel</button>
      </header>

      <main className="flex-1 p-4 overflow-y-auto space-y-8 pb-28">
        <section>
          <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-4">What's Happening?</h2>
          <div className="grid grid-cols-3 gap-3">
            {BEHAVIOR_TAGS.map(tag => renderTag(tag, 'behavior'))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-4">Environment</h2>
          <div className="grid grid-cols-3 gap-3">
            {ENVIRONMENT_TAGS.map(tag => renderTag(tag, 'environment'))}
          </div>
        </section>

        <section>
            <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-4">Overall State</h2>
            <div className="flex items-center justify-between p-1 rounded-full bg-[var(--surface-primary)] border border-[var(--border-primary)]">
                {[1, 2, 3, 4, 5].map(value => (
                    <button 
                      key={value} 
                      onClick={() => setOverallState(value)} 
                      className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${overallState === value ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'}`}
                    >
                        {value}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-500 mt-2 px-2">
                <span style={{ color: 'var(--state-calm)' }}>Calm</span>
                <span style={{ color: 'var(--state-overwhelmed)' }}>Overwhelmed</span>
            </div>
        </section>
        
        <section>
          <h2 className="text-lg font-bold text-[var(--text-secondary)] mb-4">Context Note (Optional)</h2>
          <textarea 
            value={contextNote} 
            onChange={(e) => setContextNote(e.target.value)} 
            className="w-full p-3 bg-[var(--surface-primary)] border-2 border-[var(--border-primary)] rounded-xl focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
            placeholder="e.g., At the supermarket checkout..."
            rows={3}
          ></textarea>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--background-primary)] to-transparent">
        <button 
          onClick={handleSave} 
          className="w-full py-4 text-lg font-bold text-white bg-[var(--accent-primary)] rounded-2xl hover:bg-opacity-90 transition-all duration-200 transform active:scale-95 shadow-lg shadow-[var(--accent-primary)]/20"
        >
          Save Moment
        </button>
      </footer>
    </div>
  );
};

export default LogMomentPage; 