import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center min-h-[200px]">
      <div 
        className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 mb-4"
        style={{borderColor: 'var(--primary-color)', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: 'var(--primary-color)', borderLeftColor: 'var(--primary-color)'}}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading...</span>
      </div>
      <p className="text-[var(--text-primary)] text-base md:text-lg font-semibold">{message}</p>
      <p className="text-[var(--text-secondary)] text-sm mt-1">Please wait a moment.</p>
    </div>
  );
};
