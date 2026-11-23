# Portfolio — Kauã Villa Nova

Bilingual (pt/en) personal portfolio built with **Next.js 16**, being migrated to an explorable 3D experience: scrolling flies the camera through a three.js world, with a HUD, intro, procedural audio and per-project *case files*.

> **Status:** migration planned (docs and backlog ready), implementation not started yet. The current code in `src/` is the previous version of the site.

## Running

```bash
npm install        # or `npm ci` to respect the lockfile
npm run dev        # http://localhost:3000  (Portuguese at /pt)
npm run build && npm start
npm run lint
```

### Environment variables (contact form)

Create `.env.local` (not versioned) with:

```
EMAIL_ADDRESS_RECEIVER=
EMAIL_ADDRESS_SENDER=
SMTP_HOST=
SMTP_PORT=
GMAIL_APP_PASSWORD=
```

## Documentation

| | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Guide for Claude Code and collaborators: rules, workflow, conventions |
| [`.claude/docs/TASKS.md`](.claude/docs/TASKS.md) | Backlog: 37 tasks, 5 milestones, dependencies |
| [`.claude/docs/REFERENCE-ANALYSIS.md`](.claude/docs/REFERENCE-ANALYSIS.md) | Analysis of the reference site (37 features) |
| [`.claude/docs/ARCHITECTURE.md`](.claude/docs/ARCHITECTURE.md) | Target architecture and decisions |
| [`.claude/docs/GAP-ANALYSIS.md`](.claude/docs/GAP-ANALYSIS.md) | Current vs. target |
| [`.claude/docs/CONTENT.md`](.claude/docs/CONTENT.md) | Content and decisions that depend on the owner |

## Stack

Next.js 16 · React 19 · TypeScript · next-intl · SCSS Modules · zustand · react-hook-form + zod · nodemailer.
Target: + three.js · GSAP/ScrollTrigger · Lenis · WebAudio.
