# Backend Instructions

Persistent rules for future backend/API work in this repository.

## Architecture
- Use modular route/controller/service separation where appropriate.
- Keep business logic out of transport-layer handlers.
- Prefer explicit data contracts between layers.

## API Quality
- Validate inputs clearly and early.
- Use explicit error handling with predictable status codes.
- Return predictable response shapes across endpoints.
- Keep API behavior observable through useful logs.

## Configuration and Reliability
- Use environment-driven configuration.
- Avoid hidden magic, implicit side effects, and unclear defaults.
- Keep dependencies and integration boundaries explicit.
- Favor maintainability and debuggability over clever shortcuts.
