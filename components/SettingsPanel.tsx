import React from 'react';

interface SettingsPanelProps {
  enableVoice: boolean;
  onToggleVoice: () => void;
  enableGamification: boolean;
  onToggleGamification: () => void;
  enableBodyDouble: boolean; // New prop
  onToggleBodyDouble: () => void; // New prop
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  enableVoice,
  onToggleVoice,
  enableGamification,
  onToggleGamification,
  enableBodyDouble, // Destructure new prop
  onToggleBodyDouble, // Destructure new prop
}) => {
  return (
    <div className="fixed bottom-4 right-4 bg-[var(--bg-card)] p-3 md:p-4 rounded-xl shadow-2xl border border-[var(--border-light)] z-50 w-60 md:w-72"> {/* Increased width slightly */}
      <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-3 border-b border-[var(--border-light)] pb-2">Settings</h3>
      <div className="space-y-3">
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

        {/* Live Body Double Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="bodyDoubleToggle" className="text-sm text-[var(--text-secondary)] cursor-pointer flex items-center group">
            <i className={`fas ${enableBodyDouble ? 'fa-headset text-purple-500' : 'fa-headset text-slate-400'} mr-2 w-5 text-center transition-colors group-hover:text-purple-500`}></i>
            Body Double
          </label>
          <button
            id="bodyDoubleToggle"
            onClick={onToggleBodyDouble}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 ${
              enableBodyDouble ? 'bg-purple-500' : 'bg-slate-300 hover:bg-slate-400'
            }`}
            role="switch"
            aria-checked={enableBodyDouble}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                enableBodyDouble ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>
    </div>
  );
};
