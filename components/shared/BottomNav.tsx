import React from 'react';
import { AppScreen } from '../../types';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const isActive = (screen: AppScreen): boolean => {
    return currentScreen === screen;
  };

  return (
    <nav className="sticky bottom-0 z-10 flex justify-around border-t border-[var(--one-app-border)] bg-[var(--one-app-surface)] pb-2 pt-2.5 shadow-t-md">
      <button
        className={`flex flex-1 flex-col items-center justify-end gap-0.5 py-1 ${
          isActive(AppScreen.LogMoment)
            ? 'text-[var(--one-app-primary-darker,theme(colors.sky.700))] rounded-lg bg-[var(--one-app-primary-lighter,theme(colors.sky.100))]'
            : 'text-[var(--one-app-text-secondary)]'
        }`}
        onClick={() => onNavigate(AppScreen.LogMoment)}
      >
        <span className={`material-icons-outlined ${isActive(AppScreen.LogMoment) ? '!text-[var(--one-app-primary-darker,theme(colors.sky.700))]' : ''}`}>add_chart</span>
        <p className={`text-xs ${isActive(AppScreen.LogMoment) ? 'font-bold' : 'font-medium'} leading-normal`}>Log Moment</p>
      </button>
      <button
        className={`flex flex-1 flex-col items-center justify-end gap-0.5 py-1 ${
          isActive(AppScreen.Timeline)
            ? 'text-[var(--one-app-primary-darker,theme(colors.sky.700))] rounded-lg bg-[var(--one-app-primary-lighter,theme(colors.sky.100))]'
            : 'text-[var(--one-app-text-secondary)]'
        }`}
        onClick={() => onNavigate(AppScreen.Timeline)}
      >
        <span className={`material-icons-round ${isActive(AppScreen.Timeline) ? '!text-[var(--one-app-primary-darker,theme(colors.sky.700))]' : ''}`}>history</span>
        <p className={`text-xs ${isActive(AppScreen.Timeline) ? 'font-bold' : 'font-medium'} leading-normal`}>Timeline</p>
      </button>
      <button
        className={`flex flex-1 flex-col items-center justify-end gap-0.5 py-1 ${
          isActive(AppScreen.Dashboard)
            ? 'text-[var(--one-app-primary-darker,theme(colors.sky.700))] rounded-lg bg-[var(--one-app-primary-lighter,theme(colors.sky.100))]'
            : 'text-[var(--one-app-text-secondary)]'
        }`}
        onClick={() => onNavigate(AppScreen.Dashboard)}
      >
        <span className="material-icons-outlined">auto_stories</span>
        <p className={`text-xs ${isActive(AppScreen.Dashboard) ? 'font-bold' : 'font-medium'} leading-normal`}>Dashboard</p>
      </button>
      <button
        className="flex flex-1 flex-col items-center justify-end gap-0.5 text-[var(--one-app-text-secondary)] py-1"
        disabled
      >
        <span className="material-icons-outlined">settings</span>
        <p className="text-xs font-medium leading-normal">Settings</p>
      </button>
    </nav>
  );
};

export default BottomNav;
