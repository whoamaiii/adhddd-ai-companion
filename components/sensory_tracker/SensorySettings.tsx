import React, { useState } from 'react';
import type { SensoryMoment } from '../../types';

/**
 * Props for the SensorySettings component.
 */
interface SensorySettingsProps {
  /**
   * The array of sensory moments to be exported.
   */
  moments: SensoryMoment[];
  /**
   * A function to close the settings view.
   */
  onClose: () => void;
  /**
   * The array of custom behavior tags.
   */
  customBehaviors: string[];
  /**
   * The array of custom environment tags.
   */
  customEnvironments: string[];
  /**
   * Function to add a new custom tag.
   */
  onAddTag: (tag: string, type: 'behavior' | 'environment') => void;
  /**
   * Function to delete a custom tag.
   */
  onDeleteTag: (tag: string, type: 'behavior' | 'environment') => void;
}

/**
 * A component for managing Sensory Tracker settings, including data export and custom tags.
 */
const SensorySettings: React.FC<SensorySettingsProps> = ({ 
  moments, 
  onClose,
  customBehaviors,
  customEnvironments,
  onAddTag,
  onDeleteTag
}) => {
  const [newBehavior, setNewBehavior] = useState('');
  const [newEnvironment, setNewEnvironment] = useState('');

  const handleAddBehavior = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBehavior.trim()) {
      onAddTag(newBehavior, 'behavior');
      setNewBehavior('');
    }
  };

  const handleAddEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEnvironment.trim()) {
      onAddTag(newEnvironment, 'environment');
      setNewEnvironment('');
    }
  };

  /**
   * Converts an array of sensory moments to a CSV formatted string.
   */
  const convertToCSV = (data: SensoryMoment[]): string => {
    if (data.length === 0) return '';
    
    const headers = ['id', 'timestamp', 'overallState', 'behaviors', 'environment', 'contextNote'];
    const headerRow = headers.join(',') + '\n';

    const rows = data.map(moment => {
      const timestamp = new Date(moment.timestamp).toISOString();
      const behaviors = `"${moment.behaviors.join('; ')}"`; // Enclose in quotes to handle commas
      const environment = `"${moment.environment.join('; ')}"`;
      const contextNote = `"${moment.contextNote?.replace(/"/g, '""') ?? ''}"`; // Escape double quotes

      return [moment.id, timestamp, moment.overallState, behaviors, environment, contextNote].join(',');
    });

    return headerRow + rows.join('\n');
  };

  /**
   * Handles the click event for the export button, triggering the CSV download.
   */
  const handleExportCSV = () => {
    const csvData = convertToCSV(moments);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sensory-moments-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 bg-[var(--surface-primary)] border-b border-[var(--border-primary)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Data & Settings</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-secondary)]">
            <span className="material-icons-outlined">close</span>
        </button>
      </div>

      {/* Custom Tag Management */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3">Manage Custom Tags</h4>
        
        {/* Behavior Tags */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--text-secondary)] mb-2" htmlFor="new-behavior-input">Custom Behaviors</label>
          <form onSubmit={handleAddBehavior} className="flex gap-2 mb-2">
            <input 
              id="new-behavior-input"
              type="text" 
              value={newBehavior}
              onChange={(e) => setNewBehavior(e.target.value)}
              placeholder="e.g., Rocking"
              className="flex-1 input-base" 
            />
            <button type="submit" className="button-primary px-4">Add</button>
          </form>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-[var(--surface-secondary)] rounded-md">
            {customBehaviors.length === 0 && <span className="text-xs text-[var(--text-secondary)] italic">No custom behaviors added yet.</span>}
            {customBehaviors.map(tag => (
              <span key={tag} className="tag-pill-editable bg-[var(--tag-behavior)] text-white">
                {tag}
                <button onClick={() => onDeleteTag(tag, 'behavior')} className="ml-2 font-bold text-white/70 hover:text-white text-lg leading-none top-[1px] relative">
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Environment Tags */}
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-2" htmlFor="new-environment-input">Custom Environments</label>
          <form onSubmit={handleAddEnvironment} className="flex gap-2 mb-2">
            <input 
              id="new-environment-input"
              type="text" 
              value={newEnvironment}
              onChange={(e) => setNewEnvironment(e.target.value)}
              placeholder="e.g., Quiet Room"
              className="flex-1 input-base"
            />
            <button type="submit" className="button-primary px-4">Add</button>
          </form>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-[var(--surface-secondary)] rounded-md">
            {customEnvironments.length === 0 && <span className="text-xs text-[var(--text-secondary)] italic">No custom environments added yet.</span>}
            {customEnvironments.map(tag => (
              <span key={tag} className="tag-pill-editable bg-[var(--tag-environment)] text-white">
                {tag}
                <button onClick={() => onDeleteTag(tag, 'environment')} className="ml-2 font-bold text-white/70 hover:text-white text-lg leading-none top-[1px] relative">
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Data Export */}
      <div className="pt-4 border-t border-[var(--border-primary)]">
        <h4 className="text-base font-semibold text-[var(--text-primary)] mb-2">Export Data</h4>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Export your sensory log data to a CSV file. This file can be opened in spreadsheet applications like Excel or Google Sheets.
        </p>
        <button 
          onClick={handleExportCSV} 
          disabled={moments.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-semibold transition-colors hover:bg-opacity-80 disabled:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]"
        >
          <span className="material-icons-outlined">download</span>
          Export Data to CSV
        </button>
      </div>
    </div>
  );
};

export default SensorySettings; 