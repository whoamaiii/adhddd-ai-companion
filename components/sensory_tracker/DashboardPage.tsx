import React from 'react';
import type { SensoryMoment } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { generateSensoryInsights } from '../../services/geminiService';
import { HotspotMatrix } from './HotspotMatrix';

// --- Helper Functions for Data Aggregation ---

/**
 * Aggregates and counts the frequency of behaviors.
 */
function aggregateBehaviors(moments: SensoryMoment[]): Array<{ behavior: string; count: number }> {
  const frequencyMap = new Map<string, number>();
  moments.forEach(moment => {
    moment.behaviors.forEach(behavior => {
      const normalized = behavior.toLowerCase();
      frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + 1);
    });
  });
  const aggregated = Array.from(frequencyMap, ([behavior, count]) => ({ behavior, count }));
  aggregated.sort((a, b) => b.count - a.count);
  return aggregated;
}

/**
 * Aggregates and counts the frequency of environmental triggers.
 */
function aggregateEnvironments(moments: SensoryMoment[]): Array<{ trigger: string; count: number }> {
  const frequencyMap = new Map<string, number>();
  moments.forEach(moment => {
    moment.environment.forEach(trigger => {
      const normalized = trigger.toLowerCase();
      frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + 1);
    });
  });
  const aggregated = Array.from(frequencyMap, ([trigger, count]) => ({ trigger, count }));
  aggregated.sort((a, b) => b.count - a.count);
  return aggregated;
}

/**
 * NEW: Aggregates the co-occurrence of behaviors and environments into a matrix.
 * This is the core logic for our new "Hotspots" visualization.
 */
function aggregateBehaviorEnvironmentMatrix(moments: SensoryMoment[]): { [environment: string]: { [behavior: string]: number } } {
    const matrix: { [environment: string]: { [behavior: string]: number } } = {};

    moments.forEach(moment => {
        if (!moment.environment || !moment.behaviors) return;
        moment.environment.forEach(env => {
            const normEnv = env.toLowerCase();
            if (!matrix[normEnv]) {
                matrix[normEnv] = {};
            }
            moment.behaviors.forEach(beh => {
                const normBeh = beh.toLowerCase();
                matrix[normEnv][normBeh] = (matrix[normEnv][normBeh] || 0) + 1;
            });
        });
    });

    return matrix;
}

/**
 * Main dashboard page component displaying sensory data trends and insights.
 */
const DashboardPage: React.FC<{ moments: SensoryMoment[] }> = ({ moments }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'last7days' | 'last30days' | 'alltime'>('last7days');
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const periods = ['last7days', 'last30days', 'alltime'] as const;

  // --- Memoized Data Calculations ---

  const filteredMoments = React.useMemo(() => {
    if (selectedPeriod === 'alltime') return moments;
    const now = Date.now();
    const days = selectedPeriod === 'last7days' ? 7 : 30;
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    return moments.filter(m => m.timestamp >= cutoff);
  }, [moments, selectedPeriod]);

  const frequentBehaviors = React.useMemo(() => aggregateBehaviors(filteredMoments), [filteredMoments]);
  const frequentTriggers = React.useMemo(() => aggregateEnvironments(filteredMoments), [filteredMoments]);
  
  // NEW: Calculate the behavior-environment matrix
  const behaviorEnvironmentMatrix = React.useMemo(() => aggregateBehaviorEnvironmentMatrix(filteredMoments), [filteredMoments]);

  // Henter ut unike lister for å sende til HotspotMatrix-komponenten
  const allEnvironments = React.useMemo(() => Object.keys(behaviorEnvironmentMatrix), [behaviorEnvironmentMatrix]);
  const allBehaviors = React.useMemo(() => {
      const behaviorSet = new Set<string>();
      Object.values(behaviorEnvironmentMatrix).forEach(behaviorMap => {
          Object.keys(behaviorMap).forEach(beh => behaviorSet.add(beh));
      });
      return Array.from(behaviorSet);
  }, [behaviorEnvironmentMatrix]);

  const chartData = React.useMemo(() => {
    return filteredMoments
      .map(m => ({ date: new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), state: m.overallState }))
      .reverse();
  }, [filteredMoments]);

  const [aiInsight, setAiInsight] = React.useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchInsight = async () => {
      if (!apiKey || filteredMoments.length === 0) {
        setAiInsight("Log more moments to unlock AI-powered insights.");
        return;
      }
      setIsLoadingInsight(true);
      try {
        const genAI = new GoogleGenAI(apiKey);
        const insight = await generateSensoryInsights(genAI, filteredMoments);
        setAiInsight(insight);
      } catch (error) {
        console.error("Failed to fetch AI insight:", error);
        setAiInsight("Could not generate insights at this time.");
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsight();
  }, [filteredMoments, apiKey]);
  
  // --- Render ---

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.32))] bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-transparent backdrop-blur-sm">
        <h1 className="text-xl font-bold flex-1 text-center">Dashboard</h1>
      </header>

      {/* Time Period Filter */}
      <div className="p-3">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 text-sm font-semibold rounded-full mr-2 ${selectedPeriod === period ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--surface-primary)]'}`}
          >
            {period.replace('last', 'Last ').replace('days', ' Days')}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
        {/* Placeholder for the new Hotspots widget */}
        <div className="card-base p-4 md:col-span-2">
            <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">
                Trigger-Behavior Hotspots
            </h3>
            <HotspotMatrix 
                matrix={behaviorEnvironmentMatrix}
                behaviors={allBehaviors}
                environments={allEnvironments}
            />
        </div>

        {/* Existing Widgets */}
        <div className="card-base p-4">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">Most Frequent Behaviors</h3>
          {/* Chart implementation remains the same */}
        </div>
        <div className="card-base p-4">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">Most Common Triggers</h3>
          {/* Chart implementation remains the same */}
        </div>
        <div className="card-base p-4 md:col-span-2">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">State Over Time</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-secondary)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-primary)' }} />
                <Line type="monotone" dataKey="state" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-base p-4 md:col-span-2">
          <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4">AI-Powered Insights</h3>
          <p className="text-sm text-[var(--text-secondary)]">{isLoadingInsight ? 'Analyzing...' : aiInsight}</p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 