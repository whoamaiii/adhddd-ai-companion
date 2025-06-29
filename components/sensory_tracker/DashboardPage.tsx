import React from 'react';
import type { SensoryMoment } from '../../types';

/**
 * Props for the DashboardPage component
 */
interface DashboardPageProps {
  /** Array of sensory moments for analysis (currently unused in placeholder implementation) */
  moments: SensoryMoment[];
}

/**
 * Time period filter options for dashboard data
 */
type TimePeriod = 'last7days' | 'last30days' | 'alltime';

/**
 * Main dashboard page component displaying sensory data trends and insights.
 * 
 * Currently implements a premium visual placeholder design while data integration
 * and chart functionality will be added in future updates.
 * 
 * Features:
 * - Responsive grid layout
 * - Premium dark theme styling
 * - Interactive time period filters
 * - Placeholder charts for behavior and trigger analysis
 * - AI insights widget
 * 
 * @param props - The component props
 * @returns The rendered DashboardPage element
 */
const DashboardPage: React.FC<DashboardPageProps> = ({ moments }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('last7days');

  /**
   * Time period filter configuration
   */
  const timePeriods: Array<{ key: TimePeriod; label: string }> = [
    { key: 'last7days', label: 'Last 7 Days' },
    { key: 'last30days', label: 'Last 30 Days' },
    { key: 'alltime', label: 'All Time' }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.32))] bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-transparent backdrop-blur-sm">
        <h1 className="text-xl font-bold flex-1 text-center">Dashboard</h1>
      </header>
      
      {/* Time Period Filter */}
      <div className="flex gap-3 p-3 overflow-x-auto whitespace-nowrap">
        {timePeriods.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedPeriod(key)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
              selectedPeriod === key
                ? 'text-white bg-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
            aria-pressed={selectedPeriod === key}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
        {/* Most Frequent Behaviors Widget */}
        <div className="card-base p-4">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
            Most Frequent Behaviors
          </h3>
          <div className="flex justify-around items-end h-40">
            <div className="text-center w-1/4">
              <div 
                className="h-24 bg-[var(--tag-behavior)] rounded-t-md w-1/2 mx-auto transition-all duration-200 hover:opacity-80"
                role="img"
                aria-label="Fidgeting frequency bar"
              />
              <p className="text-xs mt-1 text-[var(--text-secondary)]">Fidgeting</p>
            </div>
            <div className="text-center w-1/4">
              <div 
                className="h-32 bg-[var(--tag-behavior)] rounded-t-md w-1/2 mx-auto transition-all duration-200 hover:opacity-80"
                role="img"
                aria-label="Pacing frequency bar"
              />
              <p className="text-xs mt-1 text-[var(--text-secondary)]">Pacing</p>
            </div>
            <div className="text-center w-1/4">
              <div 
                className="h-16 bg-[var(--tag-behavior)] rounded-t-md w-1/2 mx-auto transition-all duration-200 hover:opacity-80"
                role="img"
                aria-label="Stimming frequency bar"
              />
              <p className="text-xs mt-1 text-[var(--text-secondary)]">Stimming</p>
            </div>
          </div>
        </div>

        {/* Most Common Triggers Widget */}
        <div className="card-base p-4">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
            Most Common Triggers
          </h3>
          <div className="flex justify-around items-end h-40">
            <div className="text-center w-1/4">
              <div 
                className="h-20 bg-[var(--tag-environment)] rounded-t-md w-1/2 mx-auto transition-all duration-200 hover:opacity-80"
                role="img"
                aria-label="Loud noises frequency bar"
              />
              <p className="text-xs mt-1 text-[var(--text-secondary)]">Loud Noises</p>
            </div>
            <div className="text-center w-1/4">
              <div 
                className="h-16 bg-[var(--tag-environment)] rounded-t-md w-1/2 mx-auto transition-all duration-200 hover:opacity-80"
                role="img"
                aria-label="Crowds frequency bar"
              />
              <p className="text-xs mt-1 text-[var(--text-secondary)]">Crowds</p>
            </div>
            <div className="text-center w-1/4">
              <div 
                className="h-24 bg-[var(--tag-environment)] rounded-t-md w-1/2 mx-auto transition-all duration-200 hover:opacity-80"
                role="img"
                aria-label="New place frequency bar"
              />
              <p className="text-xs mt-1 text-[var(--text-secondary)]">New Place</p>
            </div>
          </div>
        </div>

        {/* State Over Time Widget */}
        <div className="card-base p-4 md:col-span-2">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
            State Over Time
          </h3>
          <div className="h-48 flex items-center justify-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--surface-secondary)] rounded-lg">
            <div className="text-center">
              <span className="material-icons-outlined text-4xl mb-2 block">trending_up</span>
              <p>Chart Coming Soon</p>
            </div>
          </div>
        </div>
        
        {/* AI Insights Widget */}
        <div className="card-base p-4 flex flex-col items-center justify-center text-center md:col-span-2 interactive-item">
          <div className="flex items-center justify-center size-12 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] mb-2">
            <span className="material-icons-outlined text-3xl">auto_awesome</span>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            AI-Powered Insights
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Personalized analysis and recommendations coming soon
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 