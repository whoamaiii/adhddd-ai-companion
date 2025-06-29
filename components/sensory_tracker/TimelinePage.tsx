import React from 'react';
import type { SensoryMoment } from '../../types';

/**
 * Props for the TimelinePage component
 */
interface TimelinePageProps {
  /** Array of sensory moments to display in chronological order */
  moments: SensoryMoment[];
}

/**
 * Props for the MomentCard component
 */
interface MomentCardProps {
  /** The sensory moment data to display */
  moment: SensoryMoment;
}

/**
 * A utility function to format a timestamp into a user-friendly, relative string.
 * Examples: "just now", "5m ago", "Yesterday at 10:30 AM"
 * 
 * @param timestamp - The timestamp to format (in milliseconds)
 * @returns The formatted, relative time string
 */
const formatTimestamp = (timestamp: number): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffDays = Math.floor(diffSeconds / 86400);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * A card component that displays a single sensory moment in a compact, readable format.
 * Shows the date, state, behaviors, environment, and any context notes with premium styling.
 * 
 * @param props - The component props
 * @returns The rendered MomentCard element
 */
const MomentCard: React.FC<MomentCardProps> = ({ moment }) => {
  /**
   * Gets the appropriate color for the overall state indicator
   * @param state - The state value (1-5 scale)
   * @returns CSS custom property for the state color
   */
  const getStateColor = (state: number): string => {
    if (state <= 2) return 'var(--state-calm)';
    if (state === 3) return 'var(--state-neutral)';
    return 'var(--state-overwhelmed)';
  };

  const stateColor = getStateColor(moment.overallState);

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
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Behaviors
          </h3>
          <div className="flex flex-wrap gap-2">
            {moment.behaviors.map((tag, index) => (
              <span 
                key={`${tag}-${index}`} 
                className="tag-pill text-white" 
                style={{ backgroundColor: 'var(--tag-behavior)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {moment.environment.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Environment
          </h3>
          <div className="flex flex-wrap gap-2">
            {moment.environment.map((tag, index) => (
              <span 
                key={`${tag}-${index}`} 
                className="tag-pill text-white" 
                style={{ backgroundColor: 'var(--tag-environment)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {moment.contextNote && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Context Note
          </h3>
          <p className="text-sm text-[var(--text-secondary)] italic">
            "{moment.contextNote}"
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * The main timeline page component for displaying a chronological timeline of all logged sensory moments.
 * Features premium dark theme styling, responsive design, and an engaging empty state.
 * 
 * @param props - The component props
 * @returns The rendered TimelinePage element
 */
const TimelinePage: React.FC<TimelinePageProps> = ({ moments }) => {
  // Sort moments by timestamp (newest first) for display
  const sortedMoments = React.useMemo(
    () => [...moments].sort((a, b) => b.timestamp - a.timestamp),
    [moments]
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.32))] bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-transparent backdrop-blur-sm">
        <h1 className="text-xl font-bold flex-1 text-center">Timeline</h1>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto space-y-4 pb-24">
        {sortedMoments.length > 0 ? (
          sortedMoments.map(moment => (
            <MomentCard key={moment.id} moment={moment} />
          ))
        ) : (
          <div className="text-center text-[var(--text-secondary)] pt-16 flex flex-col items-center justify-center">
            <span className="material-icons-outlined text-6xl mb-4">history</span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              No Moments Logged
            </h2>
            <p>Your logged moments will appear here.</p>
            <p>Tap the "+" on the navigation bar to log your first moment.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TimelinePage; 