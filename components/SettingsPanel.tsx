import React from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  enableVoice: boolean;
  onToggleVoice: () => void;
  enableGamification: boolean;
  onToggleGamification: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  enableVoice,
  onToggleVoice,
  enableGamification,
  onToggleGamification,
}) => {
  return (
    <div className={`fixed bottom-16 right-4 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-light)] z-50 w-72 md:w-80 max-h-[80vh] flex-col ${isOpen ? 'flex' : 'hidden'}`}>
      <div className="p-3 md:p-4 border-b border-[var(--border-light)]">
        <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">Settings</h3>
      </div>
      <div className="p-3 md:p-4 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[var(--border-light)] scrollbar-track-transparent">
        {/* Voice Assist Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="voiceToggle" className="text-sm text-[var(--text-secondary)] cursor-pointer flex items-center group">
            <i className={`fas ${enableVoice ? 'fa-volume-up text-[var(--primary-color)]' : 'fa-volume-mute text-slate-400'} mr-2 w-5 text-center transition-colors group-hover:text-[var(--primary-color)]`}></i>
            Voice Assist
          </label>
          <button
            id="voiceToggle"
            onClick={onToggleVoice}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-color)] ${
              enableVoice ? 'bg-[var(--primary-color)]' : 'bg-slate-300 hover:bg-slate-400'
            }`}
            role="switch"
            aria-checked={enableVoice}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                enableVoice ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Gamification Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="gamificationToggle" className="text-sm text-[var(--text-secondary)] cursor-pointer flex items-center group">
            <i className={`fas ${enableGamification ? 'fa-star text-[var(--warning-color)]' : 'fa-star text-slate-400'} mr-2 w-5 text-center transition-colors group-hover:text-[var(--warning-color)]`}></i>
             Streaks
          </label>
          <button
            id="gamificationToggle"
            onClick={onToggleGamification}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--warning-color)] ${
              enableGamification ? 'bg-[var(--warning-color)]' : 'bg-slate-300 hover:bg-slate-400'
            }`}
            role="switch"
            aria-checked={enableGamification}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                enableGamification ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>


      </div>
    </div>
  );
};
