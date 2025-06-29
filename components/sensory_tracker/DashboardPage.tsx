import React from 'react';
import type { SensoryMoment } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { generateSensoryInsights } from '../../services/geminiService';

/**
 * Props for the DashboardPage component
 */
interface DashboardPageProps {
  /** Array of sensory moments for analysis */
  moments: SensoryMoment[];
}

/**
 * Time period filter options for dashboard data
 */
type TimePeriod = 'last7days' | 'last30days' | 'alltime';

/**
 * Aggregates behaviors from moments and returns them sorted by frequency.
 * Normalizes behavior names to lowercase to prevent duplicate counting.
 *
 * @param moments - Array of sensory moments to process
 * @returns Sorted array of behaviors with their counts
 */
function aggregateBehaviors(moments: SensoryMoment[]): Array<{ behavior: string; count: number }> {
  // 1. Initialize a Map for efficient frequency counting
  const frequencyMap = new Map<string, number>();

  // 2. Iterate through all moments and their behaviors to populate the map
  moments.forEach(moment => {
    moment.behaviors.forEach(behavior => {
      // Normalize the behavior to lower case to prevent split counts (e.g., "Pacing" vs "pacing")
      const normalizedBehavior = behavior.toLowerCase();
      const currentCount = frequencyMap.get(normalizedBehavior) || 0;
      frequencyMap.set(normalizedBehavior, currentCount + 1);
    });
  });

  // 3. Convert the Map to a sortable array
  const aggregated = Array.from(frequencyMap, ([behavior, count]) => ({ behavior, count }));
  
  // 4. Sort the array descending by count to ensure the most frequent items are first
  aggregated.sort((a, b) => b.count - a.count);

  return aggregated;
}

/**
 * Aggregates environmental triggers from moments and returns them sorted by frequency.
 * Normalizes trigger names to lowercase to prevent duplicate counting.
 *
 * @param moments - Array of sensory moments to process
 * @returns Sorted array of triggers with their counts
 */
function aggregateEnvironments(moments: SensoryMoment[]): Array<{ trigger: string; count: number }> {
  // 1. Initialize a Map for efficient frequency counting
  const frequencyMap = new Map<string, number>();

  // 2. Iterate through all moments and their environment triggers to populate the map
  moments.forEach(moment => {
    moment.environment.forEach(trigger => {
      // Normalize the trigger to lower case to prevent split counts
      const normalizedTrigger = trigger.toLowerCase();
      const currentCount = frequencyMap.get(normalizedTrigger) || 0;
      frequencyMap.set(normalizedTrigger, currentCount + 1);
    });
  });

  // 3. Convert the Map to a sortable array
  const aggregated = Array.from(frequencyMap, ([trigger, count]) => ({ trigger, count }));
  
  // 4. Sort the array descending by count to ensure the most frequent items are first
  aggregated.sort((a, b) => b.count - a.count);

  return aggregated;
}

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

  /**
   * Filters moments based on the selected time period.
   * @param moments - Array of sensory moments to filter
   * @param period - Selected time period
   * @returns Filtered array of moments
   */
  const filterMomentsByPeriod = (
    moments: SensoryMoment[],
    period: TimePeriod
  ): SensoryMoment[] => {
    if (period === 'alltime') return moments;
    
    const now = Date.now();
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    
    let cutoffTime: number;
    if (period === 'last7days') {
      cutoffTime = now - (7 * millisecondsInDay);
    } else { // 'last30days'
      cutoffTime = now - (30 * millisecondsInDay);
    }
    
    return moments.filter(moment => moment.timestamp >= cutoffTime);
  };

  /**
   * A memoized array of the most frequent behaviors, calculated from the moments prop.
   * The calculation is wrapped in useMemo to prevent re-computation on every render,
   * which is critical for performance as the number of moments grows.
   * @returns {Array<{behavior: string, count: number}>} A sorted array of aggregated behaviors.
   */
  const frequentBehaviors = React.useMemo(() => {
    // Filter moments based on selected period
    const filteredMoments = filterMomentsByPeriod(moments, selectedPeriod);
    // Use existing aggregation logic on filtered data
    return aggregateBehaviors(filteredMoments);
  }, [moments, selectedPeriod]); // The dependency array ensures this only runs when 'moments' or 'selectedPeriod' changes

  /**
   * A memoized array of the most common environmental triggers, calculated from the moments prop.
   * Like frequentBehaviors, this is memoized for performance optimization.
   * @returns {Array<{trigger: string, count: number}>} A sorted array of aggregated triggers.
   */
  const frequentTriggers = React.useMemo(() => {
    // Filter moments based on selected period
    const filteredMoments = filterMomentsByPeriod(moments, selectedPeriod);
    // Use existing aggregation logic on filtered data
    return aggregateEnvironments(filteredMoments);
  }, [moments, selectedPeriod]); // The dependency array ensures this only runs when 'moments' or 'selectedPeriod' changes

  /**
   * Prepares chart data from filtered moments for the state over time visualization.
   * Transforms SensoryMoment data into a format compatible with recharts LineChart.
   * @returns {Array<{date: string, state: number}>} Array of data points for the chart
   */
  const chartData = React.useMemo(() => {
    const filteredMoments = filterMomentsByPeriod(moments, selectedPeriod);
    return filteredMoments.map(moment => ({
      // Format the timestamp for the X-axis label
      date: new Date(moment.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      // Use the overallState for the Y-axis value
      state: moment.overallState
    })).reverse(); // Reverse to show chronological order
  }, [moments, selectedPeriod]);

  // State for AI-generated insights
  const [aiInsight, setAiInsight] = React.useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = React.useState<boolean>(false);
  const [insightError, setInsightError] = React.useState<string | null>(null);

  // Check if API key is configured
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hasApiKey = !!apiKey;

  // Effect to fetch AI insights when filtered moments change
  React.useEffect(() => {
    const fetchInsight = async () => {
      const filteredMoments = filterMomentsByPeriod(moments, selectedPeriod);
      
      // Skip if no API key
      if (!hasApiKey) {
        setIsLoadingInsight(false);
        setInsightError(null);
        setAiInsight("");
        return;
      }

      if (filteredMoments.length === 0) {
        setAiInsight("Log your moments to get AI-powered insights.");
        setIsLoadingInsight(false);
        setInsightError(null);
        return;
      }

      setIsLoadingInsight(true);
      setInsightError(null);
      try {
        // Initialize Gemini client - we know apiKey exists here
        const genAI = new GoogleGenAI(apiKey);
        
        // Generate the insight
        const insight = await generateSensoryInsights(genAI, filteredMoments);
        setAiInsight(insight);
      } catch (error) {
        console.error("Failed to fetch AI insight:", error);
        setInsightError("Could not generate insights. Please try again later.");
        setAiInsight(""); // Clear any previous insight
      } finally {
        setIsLoadingInsight(false);
      }
    };

    fetchInsight();
  }, [moments, selectedPeriod, hasApiKey]); // Dependencies: re-run when moments, selectedPeriod, or hasApiKey changes

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

      {/* Data count indicator */}
      <div className="px-4 pb-2 text-sm text-[var(--text-secondary)]">
        {(() => {
          const filteredCount = filterMomentsByPeriod(moments, selectedPeriod).length;
          const periodText = selectedPeriod === 'last7days' ? 'last 7 days' :
                            selectedPeriod === 'last30days' ? 'last 30 days' :
                            'all time';
          return `Showing ${filteredCount} moment${filteredCount !== 1 ? 's' : ''} from ${periodText}`;
        })()}
      </div>

      <main className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
        {/* Most Frequent Behaviors Widget */}
        <div className="card-base p-4">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
            Most Frequent Behaviors
          </h3>
          {frequentBehaviors.length > 0 ? (
            <div className="flex justify-around items-end h-40">
              {frequentBehaviors.slice(0, 5).map((item) => {
                // Calculate the maximum count for normalization
                const maxCount = frequentBehaviors[0]?.count || 1;
                // Calculate height as a percentage of the maximum
                const heightPercentage = (item.count / maxCount) * 100;
                
                return (
                  <div key={item.behavior} className="text-center flex-1 px-1">
                    <div
                      className="bg-[var(--tag-behavior)] rounded-t-md w-3/4 mx-auto hover:opacity-80"
                      style={{
                        height: `${heightPercentage}%`,
                        transition: 'height 0.3s ease-in-out'
                      }}
                      role="img"
                      aria-label={`${item.behavior} was logged ${item.count} times`}
                      title={`${item.count} occurrences`}
                    />
                    <p className="text-xs mt-1 text-[var(--text-secondary)] capitalize truncate">
                      {item.behavior}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-[var(--text-secondary)]">
              <div className="text-center">
                <span className="material-icons-outlined text-3xl mb-2 block opacity-50">
                  insights
                </span>
                <p className="text-sm">Log your moments to see behavior trends here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Most Common Triggers Widget */}
        <div className="card-base p-4">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
            Most Common Triggers
          </h3>
          {frequentTriggers.length > 0 ? (
            <div className="flex justify-around items-end h-40">
              {frequentTriggers.slice(0, 5).map((item) => {
                // Calculate the maximum count for normalization
                const maxCount = frequentTriggers[0]?.count || 1;
                // Calculate height as a percentage of the maximum
                const heightPercentage = (item.count / maxCount) * 100;
                
                return (
                  <div key={item.trigger} className="text-center flex-1 px-1">
                    <div
                      className="bg-[var(--tag-environment)] rounded-t-md w-3/4 mx-auto hover:opacity-80"
                      style={{
                        height: `${heightPercentage}%`,
                        transition: 'height 0.3s ease-in-out'
                      }}
                      role="img"
                      aria-label={`${item.trigger} was logged ${item.count} times`}
                      title={`${item.count} occurrences`}
                    />
                    <p className="text-xs mt-1 text-[var(--text-secondary)] capitalize truncate">
                      {item.trigger}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-[var(--text-secondary)]">
              <div className="text-center">
                <span className="material-icons-outlined text-3xl mb-2 block opacity-50">
                  psychology_alt
                </span>
                <p className="text-sm">Log environmental triggers to see trends here.</p>
              </div>
            </div>
          )}
        </div>

        {/* State Over Time Widget */}
        <div className="card-base p-4 md:col-span-2">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
            State Over Time
          </h3>
          {chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-secondary)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-primary)',
                      border: '1px solid var(--surface-secondary)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--accent-primary)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="state"
                    stroke="var(--accent-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent-primary)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--surface-secondary)] rounded-lg">
              <div className="text-center">
                <span className="material-icons-outlined text-4xl mb-2 block">trending_up</span>
                <p>Log your moments to see state trends over time.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Insights Widget */}
        <div className="card-base p-4 flex flex-col items-center justify-center text-center md:col-span-2 interactive-item">
          <div className="flex items-center justify-center size-12 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] mb-2">
            <span className="material-icons-outlined text-3xl">auto_awesome</span>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            AI-Powered Insights
          </h3>
          {!hasApiKey ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
                Add your Gemini API key to unlock personalized insights about your sensory patterns
              </p>
              <button
                onClick={() => window.open('https://aistudio.google.com/apikey', '_blank')}
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2"
              >
                Enable AI Insights
                <span className="material-icons-outlined text-base">arrow_forward</span>
              </button>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                Set <code className="bg-[var(--surface-secondary)] px-1 py-0.5 rounded">VITE_GEMINI_API_KEY</code> in your .env.local file
              </p>
            </div>
          ) : isLoadingInsight ? (
            <div className="flex items-center justify-center h-20">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2"></div>
                <p className="text-sm text-[var(--text-secondary)]">Analyzing your data...</p>
              </div>
            </div>
          ) : insightError ? (
            <p className="text-sm text-red-500">{insightError}</p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              {aiInsight || "Log your moments to get AI-powered insights."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 