## Brief overview
- This file documents the core technology stack, architectural patterns, and code organization rules for the "ONE APP" project. All development must adhere to these standards for consistency and maintainability.

## Core technologies
- Framework: React 19+ (Hooks only for state management)
- Build tool: Vite
- Language: TypeScript
- Styling: Tailwind CSS, with global theme variables defined as CSS Custom Properties in `:root`

## Architecture
- Structure: Single Page Application (SPA)
- Navigation: Managed by a state machine in `App.tsx` using the `AppScreen` enum from `types.ts`; navigation is state-based, not URL-based
- State management: All critical app state is centralized in `App.tsx` and passed to child components via props
- AI integration: All Google Gemini API calls must go through `services/geminiService.ts`

## Component & code style
- Component naming: PascalCase (e.g., `TaskItem.tsx`)
- Service naming: camelCase (e.g., `geminiService.ts`)
- Props: Use TypeScript interfaces for all component props; handler props are prefixed with `on` (e.g., `onLaunchTool`)
- File organization: Shared components in `components/shared/`; tool-specific components in their own folders (e.g., `components/cleaning_tool/`)

## Other guidelines
- Adhere strictly to these conventions to ensure codebase clarity and ease of future expansion.
