---
name: commit-message
description: Inspect the current git changes and create a commit using this repo's conventional-commit style.
---

Effort: medium. Read the actual diff content, don't guess a type from filenames alone.

1. `git status` — see what's changed/untracked. If nothing is staged, review unstaged +
   untracked files and decide what belongs in this commit (don't blindly `git add -A` —
   skip anything that looks like a secret, credential, or stray local artifact).
2. `git diff` (and `git diff --cached` if something's already staged) — read the actual
   change, not just filenames.
3. `git log --oneline -10` — match this repo's actual style (this project uses lowercase
   Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
4. Stage the files that belong in this commit (`git add <files>`, not `-A`).
5. Draft the message:
   - `type(scope)?: summary` — imperative mood, lowercase, no trailing period, scope
     optional and only when it adds clarity (e.g. `feat(actors): ...`).
   - If the diff spans unrelated concerns, say so and prefer separate commits over one
     catch-all message.
   - Body only if the _why_ isn't obvious from the diff — skip it otherwise.
6. Show the drafted message and run `git commit -m "..."` (multi-line via heredoc).
   Never `--amend`, never `--no-verify`, unless explicitly asked.
7. `git status` to confirm the commit succeeded.
