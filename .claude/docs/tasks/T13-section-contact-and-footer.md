# T13 — Contact section and Footer

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 1 · M1 | M | T03, T04, T09 | F30 (06 Contact), F06 · fixes P3 |

## Goal
New contact section (CTAs + contact list) **keeping the existing form**, and a new footer.

## Scope
- **Contact (`#contact`, `data-station="contact"`, class `contact`)**: label `06`, title (your own "Up for a chat?"), lead, actions (primary `mailto:` e-mail; secondary scheduling CTA if D5), **contact list** (`ul.contact-list`: e-mail, GitHub, LinkedIn — phone optional) and, below, the current **`EmailForm`** restyled with the new tokens.
- `data-reveal` on the blocks; **the contact section does not "disappear" on exit** (reveal rule in T09).
- Reuse `Button`, `Input`, `EmailForm`, `ContactOptions` only if they still make sense; otherwise simplify. Contact data in `commonUrls.tsx`.
- **Footer**: a single `<footer>` (fixes the nested one — P3) with `© {year} Kauã Villa Nova · …` and the credit line ("world rendered live with three.js", after T15).
- Align `Input`/`EmailForm` styles with the new design (`--line` borders, pill/radius from the tokens, focus).
- The form's success/error states remain (blink + 5 s status).

## Out of scope
API hardening (T32). Portal scene (T24).

## Acceptance criteria
- [ ] Submitting the form still works end to end (with SMTP configured) and shows the feedback.
- [ ] `mailto:` opens with a pre-filled (translated) subject.
- [ ] A single `<footer>`; no `footer > footer`.
- [ ] 390 px with no overflow; targets ≥ 48 px.
- [ ] pt/en complete; safe external links.

## Technical notes
- Do not log or display data from `.env.local`.
- The `id="contact"` and the `data-station` stay on the same `section`.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F30, F06 · `.claude/docs/CONTENT.md` (Contact) · `.claude/docs/GAP-ANALYSIS.md` P3.
