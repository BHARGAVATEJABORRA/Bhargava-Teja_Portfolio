# PROJECT Agent Operating Manual

This file is the single source of truth for how work is executed in this repository.

## Mission
Build a production-minded software engineer portfolio application through agent-driven, incremental delivery. Prioritize reliability, clarity, recruiter-facing polish, and maintainable architecture over rapid but fragile output.

## Execution Model
- Use Copilot Local / Copilot CLI for orchestration, planning, design support, QA support, and documentation support.
- Use Codex for implementation, integration, refactoring, and final execution.
- Keep decisions explicit and record non-trivial tradeoffs in project documentation.
- Deliver in small phases with verifiable outcomes.

## MCP Usage
Use MCP tools intentionally:
- GitHub MCP for repository context, issues, pull requests, and workflow visibility.
- Context7 MCP for framework/library behavior and documentation lookup before assumptions.
- MongoDB MCP for data modeling and query support.
- Playwright MCP for UI/browser validation and regression checks.
- Microsoft Learn MCP when platform guidance is relevant.
- Sentry MCP later in the lifecycle for monitoring and production diagnostics.
- shadcn MCP is available for browsing and installing shadcn-compatible components.
- React Bits registry is configured through `components.json` via `@react-bits`.
- For frontend UI work, agents may use shadcn MCP to discover, add, and adapt components when it improves speed, consistency, and polish.

## Working Style
- Plan first, implement second, verify third, document fourth.
- Favor sequential execution when tasks overlap in file ownership.
- Use parallel execution only when ownership and touched files do not overlap.
- Keep changes scoped, reviewable, and reversible.
- Avoid speculative abstractions; optimize for clarity and long-term maintainability.

## Coding Rules
- Prefer readable, flat, predictable code over cleverness.
- Keep architecture simple and responsibilities explicit.
- Use explicit control flow and descriptive naming.
- Handle errors explicitly; do not silently swallow failures.
- Keep logging useful for diagnostics and free of secrets.
- Keep regenerable files reproducible.
- Preserve testable behavior for each meaningful change.

## Folder Ownership (Future Structure)
Use these ownership boundaries as the repository grows:
- `frontend/`: UI routes, components, state, accessibility, responsive behavior.
- `backend/`: API routes, controllers, services, auth, external integrations.
- `data/`: schemas, model contracts, migrations, seeds.
- `tests/`: unit, integration, end-to-end tests, fixtures.
- `docs/`: setup guides, architecture notes, feature and decision records.
- `.github/`: agent definitions, instructions, prompt templates, process conventions.
- `.codex/skills/`: reusable Codex workflows for repeatable execution.

If work spans multiple folders, define execution order before coding to reduce conflicts.

## Orchestration Workflow
1. Intake: Clarify scope, constraints, and expected outcomes.
2. Planning: Break work into phases, dependencies, risks, and ownership.
3. Design: Define UI/UX direction and accessibility expectations for user-facing changes.
4. Implementation: Execute the smallest clean change set with clear integration points.
5. QA: Validate smoke paths, regressions, and edge cases (including browser validation for UI).
6. Docs: Update setup, architecture, and feature notes to match reality.
7. Handoff: Summarize changed files, validation results, residual risks, and next actions.

## Quality Bar
- Acceptance criteria are met without ambiguity.
- Touched areas show no obvious regressions.
- Error paths are handled and observable.
- Code remains understandable to a new engineer.
- Documentation reflects actual behavior.
- Validation evidence exists for non-trivial changes.

## Definition of Done
A task is complete only when all conditions are true:
- Requested scope is fully implemented.
- Changes are integrated cleanly across affected layers.
- Validation is complete (tests and/or manual QA; Playwright for UI when applicable).
- Known risks and constraints are explicitly documented.
- Required documentation/instructions/prompts are updated.
- Output is reviewer-ready with no hidden TODOs or ambiguous behavior.
