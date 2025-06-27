import React from 'react';

const Footer: React.FC = () => {
  const handleSettingsClick = () => {
    // TODO: Implement settings functionality
    console.log('Settings clicked');
  };

  const handleDarkModeToggle = () => {
    // TODO: Implement dark mode toggle functionality
    console.log('Dark mode toggle clicked');
  };

  return (
    <footer className="bg-[var(--secondary-color)]/50 backdrop-blur-sm border-t border-[var(--glass-border)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleSettingsClick}
              className="flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            >
              <svg 
                className="mr-1.5" 
                fill="currentColor" 
                height="20px" 
                viewBox="0 0 256 256" 
                width="20px" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M216,130.16q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"></path>
              </svg>
              Settings
            </button>
            <div className="flex items-center">
              <span className="text-sm text-[var(--text-secondary)] mr-2">Dark Mode</span>
              <button 
                onClick={handleDarkModeToggle}
                aria-checked="true" 
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[var(--glass-border)] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-[var(--secondary-color)]" 
                role="switch" 
                type="button"
              >
                <span className="sr-only">Toggle dark mode</span>
                <span 
                  aria-hidden="true" 
                  className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                ></span>
              </button>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">© 2024 ONE APP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
