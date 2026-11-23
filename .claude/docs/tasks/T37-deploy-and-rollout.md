# T37 — Deploy and rollout

| Phase | Size | Depends on | Covers |
|---|---|---|---|
| 4 · M5 | S | T36 | publication |

## Goal
Publish v3 safely, with the ability to roll back.

## Scope
- **Preview:** preview deployment (Vercel) of the branch/PR; visual checklist on real devices (iPhone/Safari and Android/Chrome included — audio, `100svh`, `dialog`, WebGL).
- **Environment variables** on the provider: `EMAIL_ADDRESS_RECEIVER`, `EMAIL_ADDRESS_SENDER`, `SMTP_HOST`, `SMTP_PORT`, `GMAIL_APP_PASSWORD` (and `NEXT_PUBLIC_SITE_URL`/equivalent for `metadataBase`). Do **not** paste values into issues/PRs/logs.
- **Production smoke test:** send a real email through the form; check `/`, `/pt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, OG (preview on Facebook/Twitter/LinkedIn/WhatsApp), Lighthouse in production.
- **Merge strategy:** `v3` → `main` via PR (squash or merge, your call); tag `v3.0.0`; keep the previous version accessible (tag/branch) for quick rollback.
- **Domain/redirects:** check that the current domain points to the project and whether there are old URLs to redirect (`next.config.ts` → `redirects`).
- **Post-launch (first 48 h):** watch errors (provider logs), performance reports on weak devices and the average tier observed; open adjustment tasks.
- Decide analytics (D7): **none** by default.

## Out of scope
New features.

## Acceptance criteria
- [ ] Preview approved on real devices; T33/T34 checklist re-run on the preview.
- [ ] Form sends a real email in production.
- [ ] OG/SEO correct in both languages in production.
- [ ] Tag created and rollback procedure noted in the README/`.claude/docs/`.
- [ ] No secret in history, logs or docs.

## Technical notes
- If the 3D causes problems in production, the emergency fallback is to set `NEXT_PUBLIC_DISABLE_WORLD=1` and redeploy (kill switch created in T15): the site keeps running in `no-webgl` mode, without reverting the release. Test this switch on the preview before launch.

## Reading
`.claude/docs/ARCHITECTURE.md` §10 · `.claude/docs/tasks/T33`, `T34`.
