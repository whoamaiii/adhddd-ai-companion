# Project Documentation – ADHD Cleaning Companion ("ONE APP")

============================================================
This document gives you a bird's-eye view of every file that currently exists in the repository (excluding design images, markdown guidelines, etc.).  
For each file you will see • what it contains/exports • how it is used by other parts of the codebase • relevant side–effects.

Legend  
• ①  =  imports/depends on • ②  =  is imported by / consumed by

────────────────────────────────────────────────────────────
Top-level source files
────────────────────────────────────────────────────────────
App.tsx  
• Root React component rendered by Vite in index.tsx.  
• Holds global UI-state (current screen, tasks, sensory-moments, settings, streak, loading/error).  
• Coordinates the two major features:  
  – "Cleaning Companion" image → task generator.  
  – "Sensory & Feeling Tracker" (log moment, dashboard, timeline).  
• Interacts with:
  ① types.ts (Task, SensoryMoment, AppScreen enums)  
  ① services/geminiService.ts (AI calls)  
  ① uuidv4 (for id generation)  
  ① component set (Header, ImageUploader, TaskList, etc.)  
  ② index.tsx (App is rendered)  

index.tsx / index.html / index.css  
• Standard Vite entry, injects <App/> into #root.  
• index.css defines CSS variables such as "--state-calm" used across components.

constants.ts  
• Holds Gemini model name, system prompts & template strings.  
• ① services/geminiService.ts consumes these.

types.ts  
• Central TypeScript types & enums shared everywhere (Task, SensoryMoment, etc.).  
• ② Used by almost every TS/TSX file.

global.d.ts  
• Declares ambient types (e.g. allows importing *.png etc.).  

vite.config.ts / tsconfig.json / eslint.config.mjs  
• Build tooling & linting configuration.

────────────────────────────────────────────────────────────
Services (business / async logic)
────────────────────────────────────────────────────────────
services/geminiService.ts  
• Thin wrapper around Google GenAI SDK.  
• Exports three async helpers: analyzeImageWithGemini, generateCleaningPlanWithGemini, generateCelebratoryMessageForTask.  
• Handles:  
  – Converting base64 images into Gemini "Parts".  
  – Parsing Gemini JSON responses (robust to fenced-code & malformed scenarios).  
  – Mapping AI JSON into internal Task objects.  
• ② Called exclusively from App.tsx.

services/voiceCommandService.ts (only declared, not yet imported)  
• Placeholder for future speech recognition hooks.

services/agents/*  
• Experimental cognitive-agent architecture (FocusAgent, MotivationAgent, etc.).  
• Currently **unused** by UI but prepared for a future intelligent assistant layer.

────────────────────────────────────────────────────────────
Shared UI Components
────────────────────────────────────────────────────────────
components/Header.tsx  
• Sticky top bar showing title & gamification-streak.  
• Emits onToggleSettings – consumed in App.tsx.  

components/Footer.tsx  
• Simple footer with attribution/links.

components/LoadingSpinner.tsx  
components/MessageCard.tsx  
• Feedback UI for processing & error/info messages.  
• Returned from App.tsx switch.

components/SettingsPanel.tsx  
• Slide-over panel toggled from Header.  
• Allows enabling Voice or Gamification; passes the toggles back into App.tsx.  

components/ImageUploader.tsx  
• Renders file-picker, produces base64 data URLs and invokes its prop onImageUpload.  
• Only used by App.tsx when screen is ImageUpload/Welcome.  

components/TaskList.tsx  
• Shows list of TaskItem children; drag-and-drop re-ordering, completion handling, inline "add task".  
• On events it bubbles up callbacks to App.tsx: onTaskComplete, onTaskReorder, onAddTask, onFocusTask.  

components/TaskItem.tsx  
• Individual draggable, swipe-to-complete item; purely presentational plus onComplete/onDrag events.  
• ① TaskList.

components/AudioVisualizer.tsx  
• Canvas-based live-audio waveform, currently **not mounted** anywhere (example exists in docs/).

components/LandingPage.tsx  
• Hero screen with two large "Launch" buttons.  
• onLaunchCleaningTool and onLaunchSensoryTracker callbacks switch AppScreen.

components/shared/BottomNav.tsx  
• Bottom tab-bar shown only on Sensory-Tracker screens (Timeline, LogMoment, Dashboard).  
• Emits onNavigate(AppScreen).

────────────────────────────────────────────────────────────
Sensory & Feeling Tracker (components/sensory_tracker)
────────────────────────────────────────────────────────────
DashboardPage.tsx  
• Placeholder summary dashboard (cards, charts to-do).  
• Receives moments prop but currently static.

LogMomentPage.tsx  
• Multi-step form to record a SensoryMoment (behaviors, environment, overallState).  
• Calls prop onSaveMoment({...}) → handled in App.tsx to persist in sensoryMoments[].

TimelinePage.tsx (file shown in prompt)  
• Read-only timeline feed.  
• Receives moments[] and contains helpers: getStateColor, getStateTitle, formatTimestamp.  
• For now it renders **mock cards**; TODO: map real moments prop.

────────────────────────────────────────────────────────────
Utilities
────────────────────────────────────────────────────────────
components/utils.ts (name indicates but file not present in snapshot)  
• If added later, share hooks/helpers.

docs/ & examples/  
• Markdown integration guides (live audio) and HTML POC for AudioVisualizer.

.clinerules/  
• Internal project guidelines (tech architecture, style conventions).

────────────────────────────────────────────────────────────
Design & Static assets
────────────────────────────────────────────────────────────
design reference for sensory & Feeling Tracker/  
Design PNGs for new tracker feature.

Design reference image/  
Main landing page mockup.

────────────────────────────────────────────────────────────
Run-time Interaction Flow
────────────────────────────────────────────────────────────
1. User lands on LandingPage (AppScreen.Home).  
2. Choosing "Cleaning Companion" → ImageUpload → handleImageUpload runs:  
   • analyzeImageWithGemini → observations[]  
   • generateCleaningPlanWithGemini → tasks[]  
3. App switches to Tasks screen.  
4. Completing each task may:  
   • Call generateCelebratoryMessageForTask for a custom praise line.  
   • Progress focus pointer; when all done, screen → AllTasksCompleted.  
5. "Sensory Tracker" path:  
   • LandingPage → LogMomentPage → onSaveMoment → sensoryMoments[].  
   • After save, screen → TimelinePage; BottomNav allows navigating timeline / dashboard / log.

────────────────────────────────────────────────────────────
Build & External Dependencies
────────────────────────────────────────────────────────────
• React 18 via Vite.  
• Tailwind (class naming indicates) w/ CSS variables.  
• @google/genai (Gemini).  
• uuid.  
• Icons: Material-Icons (span usage) & FontAwesome (className "fas").

────────────────────────────────────────────────────────────
Notes & Future Work
────────────────────────────────────────────────────────────
• Agent framework (services/agents) is not yet wired to UI.  
• AudioVisualizer & voiceCommandService are prototypes.  
• TimelinePage currently uses static demo elements; needs mapping of real moments prop.  
• Error handling funnels into MessageCard with reset paths defined.  
• Environment variable VITE_GEMINI_API_KEY is critical; absence routes to AppScreen.Error.

This concludes the comprehensive overview of the current codebase.
