import React from 'react';

interface HeaderProps {
  title: string;
  streak?: number;
}

export const Header: React.FC<HeaderProps> = ({ title, streak }) => {
  return (
    <header className="w-full max-w-2xl py-4 px-2 md:px-4 sticky top-0 z-20 bg-[var(--bg-page)]/80 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          {/* Using Font Awesome broom icon */}
          <i className="fas fa-broom text-2xl md:text-3xl text-[var(--primary-color)]"></i>
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--text-dark-gray)] tracking-tight">
            {title}
          </h1>
        </div>
        
        {typeof streak === 'number' && streak > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center rounded-full bg-rose-100 p-2 text-rose-500">
              {/* Using Font Awesome fire icon */}
              <i className="fas fa-fire text-base md:text-lg"></i>
            </div>
            <p className="text-sm font-medium text-[var(--text-medium-gray)]">
              <span className="font-semibold text-[var(--text-dark-gray)]">{streak}</span> Day Streak
            </p>
          </div>
        )}
         {typeof streak === 'number' && streak === 0 && (
          <div className="flex items-center space-x-2 opacity-70">
            <div className="flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-400">
              <i className="fas fa-fire text-base md:text-lg"></i>
            </div>
            <p className="text-sm font-medium text-[var(--text-medium-gray)]">
              No streak yet
            </p>
          </div>
        )}
      </div>
    </header>
  );
};
