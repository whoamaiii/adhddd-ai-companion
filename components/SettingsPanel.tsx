import React from 'react';
import { AmbientSoundPlayer } from './AmbientSoundPlayer';

interface SettingsPanelProps {
  enableVoice: boolean;
  onToggleVoice: () => void;
  enableGamification: boolean;
  onToggleGamification: () => void;
  enableBodyDouble: boolean;
  onToggleBodyDouble: () => void;
  enableAmbientSound: boolean;
  onToggleAmbientSound: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  enableVoice,
  onToggleVoice,
  enableGamification,
  onToggleGamification,
  enableBodyDouble,
  onToggleBodyDouble,
  enableAmbientSound,
  onToggleAmbientSound,
}) => {
  return (
    <div className="fixed bottom-4 right-4 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-light)] z-50 w-72 md:w-80 max-h-[80vh] flex flex-col">
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

        {/* Ambient Sound Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="ambientSoundToggle" className="text-sm text-[var(--text-secondary)] cursor-pointer flex items-center group">
            <i className={`fas ${enableAmbientSound ? 'fa-water text-cyan-500' : 'fa-water text-slate-400'} mr-2 w-5 text-center transition-colors group-hover:text-cyan-500`}></i>
            Ambient Sounds
          </label>
          <button
            id="ambientSoundToggle"
            onClick={onToggleAmbientSound}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-cyan-500 ${
              enableAmbientSound ? 'bg-cyan-500' : 'bg-slate-300 hover:bg-slate-400'
            }`}
            role="switch"
            aria-checked={enableAmbientSound}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                enableAmbientSound ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Ambient Sound Player */}
        {enableAmbientSound && (
          <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
            <div className="ambient-sound-container">
              <AmbientSoundPlayer 
                isActive={enableAmbientSound}
                defaultVolume={30}
                defaultSoundType="white"
              />
            </div>
          </div>
        )}

      </div>
      
      <style jsx global>{`
        .ambient-sound-container .bg-white\\/5 {
          background-color: var(--bg-secondary);
        }
        
        .ambient-sound-container h3 {
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .ambient-sound-container .text-white {
          color: var(--text-primary);
        }
        
        .ambient-sound-container .text-gray-400 {
          color: var(--text-secondary);
        }
        
        .ambient-sound-container .bg-blue-500\\/20 {
          background-color: rgba(6, 182, 212, 0.2);
        }
        
        .ambient-sound-container .border-blue-500 {
          border-color: rgb(6, 182, 212);
        }
        
        .ambient-sound-container .bg-white\\/10 {
          background-color: var(--bg-hover);
        }
        
        .ambient-sound-container .border-white\\/10 {
          border-color: var(--border-light);
        }
        
        .ambient-sound-container .text-green-400 {
          color: rgb(74, 222, 128);
        }
        
        .ambient-sound-container .bg-green-400 {
          background-color: rgb(74, 222, 128);
        }
        
        /* Adjust the component padding for better fit */
        .ambient-sound-container > div {
          padding: 0.75rem;
        }
        
        /* Make the sound type grid more compact */
        .ambient-sound-container .grid {
          gap: 0.5rem;
        }
        
        .ambient-sound-container button[class*="p-3"] {
          padding: 0.5rem;
        }
        
        /* Adjust text sizes */
        .ambient-sound-container .text-sm {
          font-size: 0.75rem;
        }
        
        .ambient-sound-container .text-xs {
          font-size: 0.625rem;
        }
      `}</style>
    </div>
  );
};
