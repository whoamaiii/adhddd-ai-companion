## Brief overview
- These guidelines specify the core technologies, architectural patterns, and system design principles for the "ADHD Cleaning Companion" web application.
- The focus is on maintaining a modular, scalable, and maintainable codebase aligned with the project's goals of accessibility, simplicity, and supportiveness for neurodivergent users.

## Core Technologies
- **Framework**: React 19+ (using Hooks exclusively for functional components).
- **Language**: TypeScript with strict mode enabled for type safety.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Styling**: Tailwind CSS via CDN, with global theme variables defined as CSS Custom Properties in `index.html`.
- **Web Components**: Lit is used for specific encapsulated components like audio features, ensuring modularity and reusability.

## Architectural Patterns
- **Structure**: Single Page Application (SPA) with state-driven navigation.
- **Navigation**: Managed internally within `App.tsx` using the `AppScreen` enum from `types.ts`. No URL-based routing is used.
- **State Management**: All critical state is centralized in `App.tsx` and propagated via props to child components, ensuring predictable data flow.
- **AI Integration**: All API calls to the Google Gemini API are routed through dedicated functions in `services/geminiService.ts`. This service uses the `gemini-2.5-flash-preview-04-17` model.
- **Agent System**: Proactive assistance is orchestrated by a system of agents managed by `AgentOrchestrator`. New agents extend `BaseAgent` and are registered with the orchestrator, supporting modular and extendable assistance features.
