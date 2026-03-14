---
name: portfolio-feature
description: Implement or extend portfolio project features with a clean, minimal, production-minded workflow. Use when requests involve adding or updating frontend, backend, data, QA, or documentation behavior in this repository and require structured execution plus validation.
---

# Portfolio Feature Skill

Use this workflow to implement feature work safely and consistently.

## Workflow
1. Understand request
- Restate scope, constraints, and acceptance criteria.
- Identify explicit non-goals to prevent scope drift.

2. Inspect current structure
- Review existing folders, touched files, and conventions.
- Confirm whether required layers already exist or need minimal scaffolding.

3. Identify affected layers
- Map impact to `frontend`, `backend`, `data`, `tests`, and `docs` as relevant.
- Note ownership and sequencing to avoid file conflicts.

4. Propose minimal implementation plan
- Break work into small phases.
- List dependencies, risks, and validation strategy per phase.

5. Implement in clean order
- Apply smallest safe change set first.
- Keep logic explicit, readable, and maintainable.
- Avoid speculative abstractions and hidden behavior.

6. Validate behavior
- Run targeted checks for core flows, regressions, and edge paths.
- Use browser validation when UI behavior changes.

7. Summarize changes and risks
- List changed files and why each changed.
- Report validation outcomes.
- Call out residual risks, assumptions, and next actions.

## Guardrails
- Do not add unrelated app scaffolding or dependencies.
- Keep changes production-minded and easy to review.
- Keep documentation aligned with implementation reality.
