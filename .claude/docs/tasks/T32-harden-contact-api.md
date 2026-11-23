# T32 — Harden the contact API

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | M | T13 | fixes P4, P5 |

## Goal
Close the gaps in email sending (HTML injection, lack of server-side validation, abuse) and document the configuration.

## Scope
- **HTML escaping** of `message`, `subject` and `contactBackEmail` before interpolating into the template (`app/api/email/route.ts`) — today they go in **raw** (HTML injection in the received email). Prefer plain text (`text:`) + HTML only with escaped values; `white-space: pre-wrap` for line breaks.
- **Server-side validation** with the same **zod** schema as the client (`src/validations/emailForm.ts`, shared): limits (subject ≤ ~120, message ≤ ~4000), valid email; 400 errors with generic messages (i18n on the client).
- **Anti-abuse:** hidden *honeypot* field (reject silently with 200) and a simple per-IP **rate limit** (e.g. 3/10 min; in-memory is enough to start with, document the limitation on serverless — or use an external store if one already exists).
- **Headers:** prevent *header injection* (strip `\r\n` from the subject and from `replyTo`).
- **Response:** do not return nodemailer's `info` object to the client (today `data: info`); respond `{ success: true }`.
- **Config:** create **`.env.example`** with only names and comments (and `!.env.example` in `.gitignore`); decide about `RESEND_API_KEY` (unused: ask the owner to remove it from their local env file — do not open `.env.local` yourself — and from the docs, or migrate to Resend); keep the missing-variable validations.
- Configuration error messages do **not** leak details to the client (server-side log, generic 500 response).

## Out of scope
Switching email provider (unless you decide to migrate to Resend).

## Acceptance criteria
- [ ] A message containing `<script>…`/`<img onerror>` arrives as **inert text** in the email.
- [ ] A subject with `\r\nBcc: x@y.z` does not inject a header.
- [ ] A request without `subject`/`message`, or above the limits, returns 400.
- [ ] The 4th consecutive request from the same IP returns 429; a filled honeypot does not send an email.
- [ ] The success response contains no nodemailer/SMTP data.
- [ ] `.env.example` committed; no secret in the repository.
- [ ] The form (T13) still shows success/error correctly.

## Technical notes
- **Never** read/print `.env.local`. Test with sandbox credentials (e.g. Ethereal) or a mocked transport.
- Handler integration tests go in T35.

## Reading
`.claude/docs/GAP-ANALYSIS.md` P4–P5.
