import React from 'react';

interface MessageCardProps {
  type: 'error' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ type, title, message, onDismiss }) => {
  
  let bgColorClass = 'bg-[var(--bg-light-accent)]';
  let borderColorClass = 'border-[var(--primary-color)]';
  let textColorClass = 'text-[var(--text-primary)]';
  let iconColorClass = 'text-[var(--primary-color)]';
  let iconClass = "fas fa-info-circle";

  switch (type) {
    case 'error':
      bgColorClass = 'bg-[var(--error-bg-light)]';
      borderColorClass = 'border-[var(--error-color)]';
      textColorClass = 'text-red-700'; // Keep specific for error text
      iconColorClass = 'text-[var(--error-color)]';
      iconClass = "fas fa-exclamation-circle";
      break;
    case 'info':
      bgColorClass = 'bg-sky-100'; // Using Tailwind's sky for info
      borderColorClass = 'border-sky-500';
      textColorClass = 'text-sky-700';
      iconColorClass = 'text-sky-500';
      iconClass = "fas fa-info-circle";
      break;
    case 'success':
      bgColorClass = 'bg-[var(--success-bg-light)]';
      borderColorClass = 'border-[var(--success-color)]';
      textColorClass = 'text-green-700'; // Keep specific for success text
      iconColorClass = 'text-[var(--success-color)]';
      iconClass = "fas fa-check-circle";
      break;
    case 'warning':
        bgColorClass = 'bg-[var(--warning-bg-light)]';
        borderColorClass = 'border-[var(--warning-color)]';
        textColorClass = 'text-yellow-700'; // Keep specific for warning text
        iconColorClass = 'text-[var(--warning-color)]';
        iconClass = "fas fa-exclamation-triangle";
        break;
  }

  const baseClasses = `p-4 md:p-6 rounded-lg shadow-md border-l-4 ${bgColorClass} ${borderColorClass} ${textColorClass}`;

  return (
    <div className={`${baseClasses} flex items-start`} role="alert">
      <div className="flex-shrink-0">
        <i className={`${iconClass} ${iconColorClass} text-xl md:text-2xl mr-3 md:mr-4 mt-1`}></i>
      </div>
      <div className="flex-grow">
        <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">{title}</h3>
        <p className="text-sm md:text-base">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`mt-3 text-xs font-semibold hover:underline ${textColorClass} opacity-80 hover:opacity-100`}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
