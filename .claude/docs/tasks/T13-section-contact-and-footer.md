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
- [x] Submitting the form still works end to end (with SMTP configured) and shows the feedback.
- [x] `mailto:` opens with a pre-filled (translated) subject.
- [x] A single `<footer>`; no `footer > footer`.
- [x] 390 px with no overflow; targets ≥ 48 px.
- [x] pt/en complete; safe external links.

## Technical notes
- Do not log or display data from `.env.local`.
- The `id="contact"` and the `data-station` stay on the same `section`.

## Reading
`.claude/docs/REFERENCE-ANALYSIS.md` F30, F06 · `.claude/docs/CONTENT.md` (Contact) · `.claude/docs/GAP-ANALYSIS.md` P3.

## Implementation notes (done 2026-11-23)
- **Decision D5:** no booking link → the HUD CTA is "Get in touch" → `#contact`; the contact section's primary action is `mailto:` with a translated, pre-filled subject.
- The form (`EmailForm`/`Input`/`Loading`) is restyled with tokens; behaviour unchanged — re-verified with `/api/email` mocked (empty → error blink + message, success → success blink + reset, server error → server message, all clearing after 5s). **A real submit (SMTP) was not performed** so as not to send email with the owner's credentials.
- One `<footer>` (fixes P3). The credit line is only "Designed and built by …"; the "world rendered with three.js" line comes with T15. Inputs are 16px (no iOS zoom) and ≥ 44px tall.
