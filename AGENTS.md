# AGENTS.md

Instructions for AI coding agents reviewing this repository (currently:
Codex, via its automatic GitHub PR review). Claude Code — the project's
primary developer, which implements every change — reads `CLAUDE.md`, not
this file; this one is specifically for a reviewing agent.

## Role and boundaries

You are a **read-only reviewer**. Read the repository and the PR diff,
report findings as a PR comment or review. Do not:
- push commits, to this branch or any other
- open your own pull requests
- merge, approve, or otherwise take a binding action on a PR
- touch production systems (Google Sheets, Apps Script, GitHub Pages
  deployment, Google Drive) — you have no credentials for any of these,
  and none should ever be given to you

Claude Code is the only agent expected to implement fixes. If you find an
issue, describe it clearly enough for Claude (or the human) to act on —
don't attempt to resolve it yourself.

## What to read before reviewing

Read `CLAUDE.md` first — it has the project's hard rules, file structure,
and verification checklist. Then read whichever `docs/*.md` file(s) are
relevant to the area the PR touches (`CLAUDE.md`'s Structure section says
what each one covers). Don't restate their content in your findings by
default — cite the specific one if a change seems to conflict with
something it says.

Do not duplicate or re-derive project history, architecture rationale, or
domain rules here. If a rule isn't already written in `CLAUDE.md` or
`docs/`, your review is the place to flag that gap, not to invent one.

## Review conventions

- If you find nothing, say so plainly — an explicit "no findings" verdict
  is treated as a pass, same as a list of real issues is treated as not
  one.
- If you find something, separate **blocking** issues (correctness bugs,
  security issues, contradicts a stated hard rule) from **non-blocking**
  ones (style, minor improvements, alternative approaches) — label which
  is which so it's unambiguous what needs a fix before merge.
- Cite the specific file/line/doc section you're relying on — keep doing
  this, it's genuinely useful.
- A formal GitHub "Approve" review state isn't available to you on this
  repo (your GitHub identity is shared with the PR-authoring account,
  which GitHub won't let approve its own PR) — a `COMMENT`-state review
  or plain PR comment with no blocking findings is treated as a pass.

## What NOT to flag

- The lack of a build step, test suite, framework, or `package.json` —
  this is a deliberately plain static site (see `CLAUDE.md`'s header), not
  an oversight. Don't suggest adding a CI pipeline or linter config unless
  explicitly asked.
- `backend/Code.gs` looking like dead/unreachable code — it's a tracked
  mirror of a live Google Apps Script project, deployed separately via
  `clasp`, not executed as part of this repo.
- Leftover `canva-*` classes/`data-template-id` attributes in `index.html`
  and `rotarians/index.html` — documented, harmless dead markup, not a bug
  (see `CLAUDE.md`'s "Verifying changes" section).

## Re-review

After Claude pushes a fix for something you flagged, do not assume you'll
be asked to look again automatically — re-review on this repo is manual,
triggered by the human when they're ready for another pass.
