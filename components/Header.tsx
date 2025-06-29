import React from 'react';
import { AppScreen } from '../types';

interface HeaderProps {
  streak?: number;
  title?: string;
  onToggleSettings: () => void;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export const Header: React.FC<HeaderProps> = ({ streak = 0, title = "ONE APP", onToggleSettings, currentScreen, onNavigate }) => {
  const isSensoryTrackerScreen = [AppScreen.LogMoment, AppScreen.Timeline, AppScreen.Dashboard].includes(currentScreen);

  return (
    <header className="sticky top-0 z-50 bg-[var(--background-primary)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {isSensoryTrackerScreen && (
              <button 
                onClick={() => onNavigate(AppScreen.Home)}
                className="mr-2 flex items-center justify-center rounded-full p-2 text-[var(--text-primary)] hover:bg-[var(--glass-background)] transition-colors duration-200"
                aria-label="Go Home"
              >
                <span className="material-icons-outlined">arrow_back</span>
              </button>
            )}
            <h1 className="text-[var(--text-primary)] text-2xl font-bold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center">
            <button className="flex items-center justify-center rounded-full p-2 text-[var(--text-primary)] hover:bg-[var(--glass-background)] transition-colors duration-200">
              <span className="sr-only">Streak counter</span>
              <svg className="text-orange-400" fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M183.89,153.34a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68ZM216,144a88,88,0,0,1-176,0c0-27.92,11-56.47,32.66-84.85a8,8,0,0,1,11.93-.89l24.12,23.41,22-60.41a8,8,0,0,1,12.63-3.41C165.21,36,216,84.55,216,144Zm-16,0c0-46.09-35.79-85.92-58.21-106.33L119.52,98.74a8,8,0,0,1-13.09,3L80.06,76.16C64.09,99.21,56,122,56,144a72,72,0,0,0,144,0Z"></path>
              </svg>
              <span className="ml-1.5 text-sm font-medium text-[var(--text-primary)]">{streak}</span>
            </button>
            <button 
              onClick={onToggleSettings}
              className="ml-2 flex items-center justify-center rounded-full p-2 text-[var(--text-primary)] hover:bg-[var(--glass-background)] transition-colors duration-200"
              aria-label="Open settings"
            >
              <svg className="text-[var(--text-secondary)]" fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-64.66V120a8,8,0,0,1-4.23,7.22,103.94,103.94,0,0,1-20.43,12.31l-1.33.44a8,8,0,0,1-9.25-6.33,88.1,88.1,0,0,0-15.4-20.38l-.4-.4a8,8,0,0,1,5.21-13.58l1.34-.39A103.94,103.94,0,0,1,211.77,84a8,8,0,0,1,4.23,7.34ZM127.22,44.23a8,8,0,0,1,7.22-4.23,103.94,103.94,0,0,1,12.31,20.43l.44,1.33a8,8,0,0,1-6.33,9.25,88.1,88.1,0,0,0-20.38,15.4l-.4.4a8,8,0,0,1-13.58-5.21l-.39-1.34A103.94,103.94,0,0,1,120,48.23,8,8,0,0,1,127.22,44.23ZM44.23,128.78a8,8,0,0,1-4.23-7.22,103.94,103.94,0,0,1,20.43-12.31l1.33-.44a8,8,0,0,1,9.25,6.33,88.1,88.1,0,0,0,15.4,20.38l.4.4a8,8,0,0,1-5.21,13.58l-1.34.39a103.94,103.94,0,0,1-20.43,12.31A8,8,0,0,1,44.23,128.78ZM128.78,211.77a8,8,0,0,1-7.22,4.23,103.94,103.94,0,0,1-12.31-20.43l-.44-1.33a8,8,0,0,1,6.33-9.25,88.1,88.1,0,0,0,20.38-15.4l.4-.4a8,8,0,0,1,13.58,5.21l.39,1.34A103.94,103.94,0,0,1,136,203.77,8,8,0,0,1,128.78,211.77Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
