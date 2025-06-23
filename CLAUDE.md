# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADHD Cleaning Companion is a web app that helps people with ADHD organize cleaning tasks through AI-powered image analysis and voice guidance. It uses Google Gemini AI to analyze photos of messy spaces and generates manageable, ADHD-friendly task lists.

## Key Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Setup Requirements

1. Create `.env.local` file in project root
2. Add Gemini API key: `VITE_GEMINI_API_KEY=your_api_key_here`
3. API key is required for all AI features

## Architecture & Code Patterns

### Navigation Flow
- Screen-based routing via `AppScreen` enum (no React Router)
- Flow: Welcome → ImageUpload → Processing → Tasks → AllTasksCompleted
- Current screen managed by single state variable in App.tsx

### State Management
- React hooks only (useState, useCallback) - no Redux/MobX
- State centralized in App.tsx and passed via props
- Max prop drilling depth: 2-3 levels
- Immutable updates using spread operators

### AI Integration Pattern
```typescript
// All AI calls go through geminiService.ts
const response = await analyzeImage(base64Image);
// Responses parsed with parseJsonFromGeminiResponse helper
// Always includes fallback values for error cases
```

### Component Patterns
- Functional components with `React.FC<Props>`
- Props destructured in signatures
- Callbacks prefixed with "handle" or "on"
- TypeScript interfaces for all props
- Self-contained state when appropriate

### Error Handling
- Try-catch with user-friendly messages
- Errors displayed via MessageCard component
- Console.error for debugging only
- Early API key validation with clear messaging

### Voice/Audio Architecture
- LiveAudioBodyDouble: Lit Web Component for Gemini Live API
- Voice commands via custom event system
- Web Speech API fallback for TTS
- Fuzzy command matching in voiceCommandService

### TypeScript Conventions
- Use `type` imports: `import type { Task } from '../types'`
- Strict mode enabled
- Union types for status states
- Partial types for incremental construction

### Styling
- Tailwind CSS via CDN (not npm package)
- CSS custom properties for theming
- Template literals for dynamic classes
- Avoid inline styles

### File Organization
- Components: PascalCase (`TaskItem.tsx`)
- Services/utils: camelCase (`geminiService.ts`) 
- Types centralized in `types.ts`
- Constants in `constants.ts`

### Import Order
1. React imports
2. External dependencies
3. Internal components
4. Types/interfaces
5. Services/utilities

## Key Implementation Details

### Gemini Service
- Model: `gemini-2.0-flash-exp` for all operations
- Handles both text and multimodal (image) inputs
- Response parsing handles JSON code blocks
- Graceful fallbacks on API errors

### Task Management
- Drag-and-drop via HTML5 drag events
- Tasks stored in React state (not persisted)
- Streak tracking in localStorage
- Task completion triggers celebratory messages

### Settings & Persistence
- User preferences in localStorage
- Voice enabled/disabled state
- Voice rate/pitch settings
- No server-side persistence

### Environment Variables
- Use `import.meta.env` for access
- Prefix with `VITE_` for client exposure
- Graceful handling when missing

## Development Notes

- No testing framework implemented
- ES modules with import maps in index.html
- Vite handles TypeScript compilation
- Font Awesome loaded via CDN
- Maximum image upload: 5MB
- Audio features require microphone permissions (see metadata.json)