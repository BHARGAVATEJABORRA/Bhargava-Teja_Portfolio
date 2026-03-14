# Frontend Instructions

Persistent rules for future React UI work in this repository.

## Core Principles
- Prioritize accessibility and responsive behavior from the first implementation.
- Favor reusable components without over-abstraction.
- Keep component logic readable and composable.
- Avoid bloated component files; split by responsibility when size grows.
- Use consistent naming, spacing, and layout rhythm.


## UI Behavior
- Provide clean loading, error, and empty states.
- Keep form validation feedback clear and actionable.
- Ensure keyboard accessibility and visible focus behavior.
- Avoid unnecessary animation; motion must support clarity.

## Component Sourcing
- Prefer existing local components first.
- When a new UI building block is needed, agents may use shadcn MCP to browse and install suitable components.
- React Bits components may be used through the configured `@react-bits` registry when they fit the design and do not add unnecessary complexity.
- Imported components should be adapted to the project style instead of pasted in blindly.

## Quality and Presentation
- Preserve visual consistency across pages and components.
- Keep recruiter-facing polish high: scannable hierarchy, stable spacing, and professional content presentation.
- Optimize for maintainability over novelty.
