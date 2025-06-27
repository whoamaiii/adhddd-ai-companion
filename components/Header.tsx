import React from 'react';

interface HeaderProps {
  streak?: number;
}

export const Header: React.FC<HeaderProps> = ({ streak = 0 }) => {
  return (
    <header className="sticky top-0 z-50 bg-[var(--background-primary)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-[var(--text-primary)] text-2xl font-bold tracking-tight">ONE APP</h1>
          </div>
          <div className="flex items-center">
            <button className="flex items-center justify-center rounded-full p-2 text-[var(--text-primary)] hover:bg-[var(--glass-background)] transition-colors duration-200">
              <span className="sr-only">Streak counter</span>
              <svg className="text-orange-400" fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M183.89,153.34a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68ZM216,144a88,88,0,0,1-176,0c0-27.92,11-56.47,32.66-84.85a8,8,0,0,1,11.93-.89l24.12,23.41,22-60.41a8,8,0,0,1,12.63-3.41C165.21,36,216,84.55,216,144Zm-16,0c0-46.09-35.79-85.92-58.21-106.33L119.52,98.74a8,8,0,0,1-13.09,3L80.06,76.16C64.09,99.21,56,122,56,144a72,72,0,0,0,144,0Z"></path>
              </svg>
              <span className="ml-1.5 text-sm font-medium text-[var(--text-primary)]">{streak}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
