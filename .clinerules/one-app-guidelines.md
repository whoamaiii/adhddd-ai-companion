## Brief overview
- These guidelines are specific to the "ONE APP" project, a unified hub of micro-tools for neurodivergent individuals. The focus is on minimal cognitive load, accessibility, clarity, and modular extensibility.

## Communication style
- All communication and UI text should be clear, concise, and supportive.
- Avoid jargon and ambiguous terms; use plain language.
- Prioritize instructions and feedback that reduce user anxiety and cognitive load.

## Development workflow
- Prioritize simplicity in both code and UI/UX; avoid unnecessary features or complexity.
- All new features must be modular micro-tools, easily added or removed without affecting the core app.
- Every change should be reviewed for accessibility and cognitive load impact before merging.

## Coding best practices
- Adhere to WCAG 2.1 AA accessibility standards (color contrast, ARIA roles, keyboard navigation).
- Follow Apple's Human Interface Guidelines for UI/UX, emphasizing a clean, "Liquid Glass" style.
- Use clear, descriptive names for components, variables, and functions (e.g., `FocusAgent`, `TaskBreakdownAgent`).
- Keep code modular and maintainable; each micro-tool should be self-contained.

## Project context
- The app is intended for neurodivergent users (ADHD, autism, OCD, anxiety, etc.).
- The user experience must be calm, focused, and empowering.
- The architecture should allow for easy future expansion with new micro-tools.

## Other guidelines
- Zero clutter: remove or avoid any UI elements that do not serve a clear, essential purpose.
- Typography should be highly readable, with sufficient contrast and spacing.
- Subtle depth and visual hierarchy should be used to guide attention without overwhelming.
- Always test new features for accessibility and ease of use before release.
