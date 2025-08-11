# Code Style Guide

## Formatting and Linting

- Use Prettier (`npm run format`) and ESLint (`npm run lint`) before committing.
- Prettier configuration: `semi: true`, `singleQuote: true`, `trailingComma: all`.
- Do not leave unformatted files or linter errors.

## Language and Comments

- Code and documentation are in English.
- Use `// comment` for brief notes; use JSDoc for complex logic.
- Avoid `any`; rely on strict typing.

## File Structure

- React components: PascalCase (`DialogEditor.tsx`), default export.
- Utilities and services: camelCase (`api.ts`, `imageCache.ts`).
- Tests live next to their code and use `*.test.ts(x)` suffix.

## React and Zustand

- Use functional components and hooks; minimize side effects in `useEffect`.
- State is stored in Zustand stores; mutate via `setState` functions.
- Maximum nesting depth of components is three levels; split more complex ones.

## Typing and Validation

- TypeScript in `strict` mode.
- Define interfaces for all public functions and components.
- Use Zod schemas to validate inputs and API responses.

## Backend

- Use `fs/promises` and `async/await`; handle errors centrally.
- Configure ports, paths, and base URLs via environment variables.
- Cover new routes with tests.

## Commits and Branches

- Follow the branching scheme in `docs/CONTRIBUTING.md`.
- Each commit is self-contained with message format `type(scope): description`.

## Documentation

- Update `docs/` for any new API or component.
- Provide examples and run instructions in `README.md`.
