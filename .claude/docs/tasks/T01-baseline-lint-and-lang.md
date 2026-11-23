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
- [x] `npm ci && npm run lint && npm run typecheck && npm run build` finish with no errors **and no lint warnings**.
- [x] `curl -s http://localhost:3000/ | grep -o '<html[^>]*>'` shows `lang="en"`; on `/pt` it shows `lang="pt"`.
- [x] Contact form: submitting empty shows a validation error + blink; a valid submit (or server error) shows the matching status and it disappears after 5 s — same as the previous behavior.

## Technical notes
- The test runner does not exist yet; form verification is manual in this task.
- Do not use `// eslint-disable` to silence `react-hooks/refs`: the rule is right.

## Reading
`.claude/docs/GAP-ANALYSIS.md` §1 (baseline).

## Implementation notes (done 2026-11-23)
- **Deviation — the lockfile was broken, not just `node_modules`.** `npm ci` failed with `Missing: @swc/helpers@0.5.24 from lock file`: the lock nests `next-intl/node_modules/@swc/core@1.15.8`, which peer-requires `@swc/helpers >=0.5.17`, but only `0.5.15` was locked. Repaired with `npm install --package-lock-only`, which only **adds** the nested `next-intl/node_modules/@swc/helpers@0.5.24` entry (+8 lines, no version changed; `next` stays at 16.1.1).
- `node_modules/.cache` was owned by `root` (left over from an old `sudo` run), which made `npm ci` die halfway while deleting `node_modules`. If it happens again: move `node_modules` aside and reinstall instead of using `sudo`.
- `EmailForm.tsx`: `triggerBlink` is a `useCallback`, and `useMemo(() => handleSubmit(...))` became a `useCallback` that calls `handleSubmit(...)(event)` **inside the event handler**, so no ref is reachable during render. No `eslint-disable`.
- `<html lang>` comes from `params` (awaited) + `hasLocale` / `notFound()`. `/xx` returns 404 (that built-in 404 page still has a bare `<html>`; it is handled with the root layout rework in T05).
- Verified against a production build: `/` → `lang="en"`, `/pt` → `lang="pt"`. Form behaviour was checked with headless Chrome (CDP) with `/api/email` mocked: empty submit → error blink + message and no request; success → success blink, form reset; server error → server message; every status clears after 5 s.
