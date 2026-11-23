# T35 — Tests and CI

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 (starts in M2) | L | T16 (grows until the end) | safety net for all features |

## Goal
Today there are no tests and no CI. Build a **proportionate** net: unit tests of the pure logic (cheap and high-value) + a few e2e tests of the critical flows + a pipeline.

## Scope
- **Vitest** (`vitest`, `node`/`jsdom` environment as appropriate) + `npm test`. Start **as soon as T16 exists** and keep adding per task.
- **Unit (pure logic, no GPU/audio):**
  - `world/quality.ts`: initial tier by environment; sampler (drops at 30 ms, "never rises after dropping", rises after 5 s at 8 ms, warm-up);
  - `world/rig-math.ts`: monotonic anchors, `locate` at the edges, `blend` (0 before .18, 1 after .82), desktop×mobile offsets;
  - `useActiveSection` (pure function of the 45% rule);
  - `audio`: note table, hover throttle, prefs merge/serialization;
  - **i18n parity** `en`↔`pt` (replaces `scripts/check-i18n.mjs`); `getWorldData()` without texts;
  - `validations/emailForm` and the `/api/email` handler (T32) with a mocked transport: escaping, limits, honeypot, rate limit.
- **e2e with Playwright** (`@playwright/test`, Chromium; software WebGL in CI with `--use-gl=swiftshader` when needed), against `next build && next start`:
  1. loads `/` and `/pt`, with no console errors;
  2. intro: skip (button and key) → `is-intro` removed;
  3. nav: click "Work" → correct hash and focus;
  4. case file: open via the button, close with `Esc`, focus returned; `/#case-<id>` opens on load;
  5. `prefers-reduced-motion`: no `is-intro`, no Lenis (`html.lenis` absent);
  6. **`no-webgl`** (block the context): `html.no-webgl`, page usable;
  7. axe with no serious/critical violations (home + dialog).
- **GitHub Actions** (`.github/workflows/ci.yml`): `npm ci` → `lint` → `typecheck` → `test` → `build`; separate e2e job (Playwright cache); fail the PR on any step.
- **Bundle size** tests (optional): fail if the initial JS exceeds the T34 budget.

## Out of scope
100% coverage: do not test shaders/scenes pixel by pixel.

## Acceptance criteria
- [ ] `npm test` runs the unit tests in < ~30 s and passes; it fails when a rule is broken (mutating a constant in `quality.ts` breaks a test).
- [ ] Local e2e (`npx playwright test`) passes; trace/screenshot on failures.
- [ ] CI green on PR; fails if lint, types, tests or build break.
- [ ] i18n parity breaks CI when a key is missing.
- [ ] README documents `npm test` and how to run e2e.

## Technical notes
- Keep pure logic **out of** files that import `three`/`window` (that is why `quality.ts` and `rig-math.ts` are separate).
- WebGL e2e is fragile in CI: mark it non-blocking if swiftshader flaps, but keep the `no-webgl` one.

## Reading
`.claude/docs/ARCHITECTURE.md` §6.3, §6.4, §10 · `CLAUDE.md` (DoD).
