---
name: atomic-commits
description: Create atomic git commits grouped by logical change. Use when the user asks for atomic commits, granular commits, or to commit changes with good separation.
disable-model-invocation: true
argument-hint: [optional commit scope hint]
---

# Atomic Git Commits

Create well-separated atomic commits for all current changes.

## Process

1. Run `git status` and `git diff --stat` to see all changes
2. Run `git log --oneline -10` to match existing commit message style
3. Read the full diff to understand every change
4. Group changes into logical units — each commit should represent ONE coherent change that could be reverted independently
5. For each group, stage only those files and commit
6. After all commits, run `git status` to verify clean working tree

## Grouping Rules

- Separate content changes from config changes from template changes
- If a data file and its template changed together for the same reason, they belong in one commit
- Test/verification changes go with the code they verify
- Never mix unrelated changes in one commit
- When in doubt, prefer smaller commits over larger ones

## Commit Message Format

Follow this project's convention:

- `fix:` — bug fixes
- `content:` — copy/text changes
- `chore:` — maintenance, cleanup
- `docs:` — documentation
- `refactor:` — code restructuring
- `perf:` — performance improvements
- `feat:` — new features

Format:

```
<type>: <short summary in lowercase>

<optional body explaining WHY, not what>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Rules

- Always use HEREDOC syntax for commit messages
- Stage specific files by name, never `git add -A` or `git add .`
- Do NOT push unless explicitly asked
- Verify clean working tree after all commits
- If there are no changes to commit, say so and stop
