## Brief overview
- These guidelines define the coding conventions and style preferences for the "ADHD Cleaning Companion" project.
- The focus is on maintaining consistency, readability, accessibility, and best practices aligned with the project's goals and the existing codebase.

## Naming
- **Components**: PascalCase (e.g., `TaskItem.tsx`).
- **Services & Utilities**: camelCase (e.g., `geminiService.ts`).
- **Props**: Handler props must be prefixed with `on` (e.g., `onLaunchCleaningTool`).

## File Organization
- **Components**: All shared components are located in `src/components/`.
- **Services**: All external service interactions, including AI, are in `src/services/`. Agent-based logic resides in `src/services/agents/`.
- **Types**: All shared TypeScript types and interfaces are centralized in `types.ts`. Use `type` imports where possible.
- **Constants**: All prompt templates and magic strings should be defined in `constants.ts`.

## Component & Prop Style
- **Props**: Always define component props using TypeScript `interface` definitions.
- **Statelessness**: Components should be as stateless as possible, receiving state and handlers from `App.tsx`.

## Accessibility
- Strictly adhere to WCAG 2.1 AA standards.
- Use semantic HTML elements and appropriate ARIA roles (e.g., `aria-current="step"` on the active `TaskItem`).
- Ensure all interactive elements are keyboard-navigable and have focus-visible styles.
