import React from 'react';

interface LandingPageProps {
  onLaunchCleaningTool: () => void;
  onLaunchSensoryTracker: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchCleaningTool, onLaunchSensoryTracker }) => {
  return (
    <>
      <h2 className="text-[var(--text-primary)] text-3xl font-bold leading-tight tracking-tight text-center mb-10 sm:text-4xl">Tools to help your brain.</h2>
      <div className="grid grid-cols-1 gap-6 @container">
        <div className="glassmorphism-card rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
          <div className="mb-4 text-[var(--primary-color)]">
            <svg className="opacity-80" fill="currentColor" height="64" viewBox="0 0 256 256" width="64" xmlns="http://www.w3.org/2000/svg">
              <path d="M236,108a12,12,0,0,1-12,12H201.45l-14.79,93.15A12,12,0,0,1,174.71,224H81.29a12,12,0,0,1-11.95-10.85L54.55,120H32a12,12,0,0,1,0-24H224A12,12,0,0,1,236,108ZM180,120H76l12.81,80H167.19ZM192,56a12,12,0,0,0-12-12H155.3a44,44,0,0,0-86.6,0H44A12,12,0,0,0,32,56v8a12,12,0,0,0,12,12H68v8H52a12,12,0,0,0,0,24h8v8H40a12,12,0,0,0,0,24h8v-8h8v8a12,12,0,0,0,12,12h8V84h96v36h8a12,12,0,0,0,12-12v-8h8a12,12,0,0,0,0-24h-8V76h12.68A12,12,0,0,0,204,64V56ZM179.3,68H153.23a12,12,0,0,0-4.56-8.68,20,20,0,0,1-41.34,0A12,12,0,0,0,102.77,68H76.7V56h20A44.06,44.06,0,0,0,100,47.12a43.57,43.57,0,0,0,56,0A44.06,44.06,0,0,0,152.05,56h20v0Z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">ADHD-Clean Hjelper</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Your AI-powered cleaning guide.</p>
          <button 
            className="glassmorphism-button w-full max-w-xs rounded-xl h-12 px-6 text-white text-base font-semibold leading-normal shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-50"
            onClick={onLaunchCleaningTool}
          >
            Launch
          </button>
        </div>
        <div className="glassmorphism-card rounded-2xl p-6 shadow-xl flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
          <div className="mb-4 text-[var(--primary-color)]">
            <svg className="opacity-80" fill="currentColor" height="64" viewBox="0 0 256 256" width="64" xmlns="http://www.w3.org/2000/svg">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM172.49,99.51a12,12,0,0,1,0,17l-32,32a12,12,0,0,1-17,0l-16-16a12,12,0,0,1,17-17L132,123l23.51-23.52A12,12,0,0,1,172.49,99.51Z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sensory & Feeling Tracker</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Track sensory experiences and emotional states for better understanding.</p>
          <button 
            className="glassmorphism-button w-full max-w-xs rounded-xl h-12 px-6 text-white text-base font-semibold leading-normal shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-50"
            onClick={onLaunchSensoryTracker}
          >
            Launch
          </button>
        </div>
      </div>
    </>
  );
};
