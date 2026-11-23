# T01 — Baseline: lint, `lang` and dependencies in sync

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 0 · M1 | S | — | fixes P1 (`GAP-ANALYSIS`), prepares F33 |

## Goal
Start from a **green** repository (lint, types, build) and fix the `<html>` element missing `lang`, so that the following tasks can require "lint with no errors" as a criterion.

## Scope
- **Sync dependencies:** `node_modules/next` is at 16.2.10 while the lock/`package.json` is at 16.1.1. Run `npm ci` (the lock file wins). If the intent was to move up to 16.2.x, do it explicitly (`package.json` + lock) in a separate commit.
- **Fix the 2 `react-hooks/refs` errors** in `src/components/items/EmailForm.tsx` (≈ lines 106 and 139). Cause: `triggerBlink` is recreated on every render, reads `blinkTimeoutRef.current` and is called inside `useMemo(() => handleSubmit(...))`. Fix: wrap `triggerBlink` in `useCallback` (without reading a ref during render) and include it in the dependencies, or swap `useMemo` for `useCallback` — **without changing behavior** (error/success blink, status message for 5 s).
- **Remove the unused `__dirname` warning** in `eslint.config.mjs` (along with any `path`/`url` imports that end up orphaned).
- **`<html lang={locale}>`** in `src/app/[locale]/layout.tsx` (read the locale from `params`/`getLocale`). Validate an invalid locale with `hasLocale` + `notFound()`.
- Add the `"typecheck": "tsc --noEmit"` script to `package.json`.

## Out of scope
Any redesign, font swap, `generateStaticParams` (comes in T05).

## Acceptance criteria
- [ ] `npm ci && npm run lint && npm run typecheck && npm run build` finish with no errors **and no lint warnings**.
- [ ] `curl -s http://localhost:3000/ | grep -o '<html[^>]*>'` shows `lang="en"`; on `/pt` it shows `lang="pt"`.
- [ ] Contact form: submitting empty shows a validation error + blink; a valid submit (or server error) shows the matching status and it disappears after 5 s — same as the previous behavior.

## Technical notes
- The test runner does not exist yet; form verification is manual in this task.
- Do not use `// eslint-disable` to silence `react-hooks/refs`: the rule is right.

## Reading
`.claude/docs/GAP-ANALYSIS.md` §1 (baseline).
