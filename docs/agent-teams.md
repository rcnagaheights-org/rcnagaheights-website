# Agent Teams — Reference Guide

Master reference for Claude Code's **agent teams** feature. Source: https://code.claude.com/docs/en/agent-teams
(as documented as of Claude Code v2.1.199+). Kept here so future sessions in this repo can design effective
multi-agent workflows without re-researching the feature each time.

> **Status**: Experimental, disabled by default. Enabled in this repo's local settings via
> `.claude/settings.local.json` → `"env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}`.

---

## Quick-reference cheat sheet

- **Use agent teams for**: research/review split across angles, independent new modules/features, competing-hypothesis
  debugging, cross-layer work (frontend+backend+tests each owned by one teammate).
- **Don't use agent teams for**: sequential work, edits to the same file, tasks with heavy dependencies between steps —
  use a single session or [subagents](#subagents-vs-agent-teams) instead.
- **Team size**: start with **3–5 teammates**. Aim for **5–6 tasks per teammate**.
- **Enable**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json/settings.local.json or shell env.
- **Spawn**: just describe the task and the roles in natural language — no separate "create team" step needed
  (as of v2.1.178+, `TeamCreate`/`TeamDelete` tools no longer exist).
- **Cost**: significantly more tokens than a single session — each teammate is a full independent context window.
- **Give each teammate**: a name, a clear scope, and enough standalone context (they do NOT inherit the lead's
  conversation history).
- **Avoid**: letting two teammates touch the same file; letting the lead do the work itself instead of delegating;
  leaving the team unattended for long stretches.

---

## What agent teams are

Agent teams coordinate **multiple independent Claude Code instances** working together:

- One session is the **team lead** — it spawns teammates, assigns/coordinates tasks, and synthesizes results.
- **Teammates** work independently, each in its own full context window, and can message each other directly.
- Unlike subagents (which only report back to the spawning session), you (the human) can also talk to any
  individual teammate directly, without going through the lead.

### Subagents vs. agent teams

| | Subagents | Agent teams |
|---|---|---|
| **Context** | Own context window; results return to the caller | Own context window; fully independent |
| **Communication** | Report results back to the main agent only | Teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Best for** | Focused tasks where only the result matters | Complex work requiring discussion and collaboration |
| **Token cost** | Lower — results summarized back to main context | Higher — each teammate is a separate Claude instance |

Rule of thumb: **do the workers need to talk to each other?** If no → subagents. If yes → agent team.

---

## Enabling agent teams

```json
// settings.json or settings.local.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Without this variable: no team is set up at session start, no team directories are written, and Claude will not
spawn or propose teammates.

---

## Starting a team

Just describe the task and the roles you want, in natural language:

```
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Spawn three teammates to explore this from different angles:
one on UX, one on technical architecture, one playing devil's advocate.
```

Claude will populate a shared task list, spawn a teammate per role, have them explore, and synthesize findings when
done.

**Two ways teammates get spawned:**
1. **You request them explicitly** — Claude spawns based on your instructions.
2. **Claude proposes them** — if it judges the task benefits from parallel work, it suggests a team; you confirm
   before it proceeds.

Claude never spawns teammates without approval either way.

### The agent panel (lead's terminal)

Below the prompt input, in-process teammates are listed:
- **Up/Down arrows** — select a teammate
- **Enter** — open that teammate's transcript / message it directly
- **Escape** — interrupt the selected teammate's current turn

Idle-row behavior (v2.1.199+): an idle teammate's row stays visible while *any* teammate/subagent is still working.
Once the whole panel is idle, idle rows hide after 30s and reappear on that teammate's next turn (it keeps running
and is still addressable while hidden — just message it by name to bring the row back).

When more than 3 teammates are idle at once, extra rows collapse into one `N idle agents` row — select + Enter to
expand, Esc to re-collapse.

---

## Controlling a team

Everything is natural-language instructions to the lead — it handles delegation.

### Display modes

- **`in-process`** (default since v2.1.179): all teammates run inside your main terminal; select via agent panel.
  Works everywhere, no setup.
- **`split-panes`**: each teammate gets its own terminal pane; requires **tmux** or **iTerm2 + `it2` CLI**.
  - `"auto"` — split panes if already inside tmux, or iTerm2 with `it2` installed; else falls back to in-process.
  - `"tmux"` — forces split-pane mode, auto-picks tmux or iTerm2.
  - `"iterm2"` (v2.1.186+) — forces iTerm2 native split panes explicitly (errors with install instructions if
    `it2` missing).

Set globally in `~/.claude/settings.json`:
```json
{ "teammateMode": "auto" }
```
Or per-session:
```bash
claude --teammate-mode auto
```
Not supported in: VS Code integrated terminal, Windows Terminal, Ghostty (in-process mode always works there).

### Specifying teammates and models

```
Spawn 4 teammates to refactor these modules in parallel. Use Sonnet for each teammate.
```

- Teammates do **not** inherit the lead's `/model` selection by default — set **Default teammate model** in
  `/config` (or choose "Default (leader's model)" to follow the lead).
- Teammates **do** inherit the lead's **effort level** (v2.1.186+ for split-pane mode too).

### Requiring plan approval

```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

Teammate works in read-only plan mode → sends a plan approval request to the **lead** (not to you) → lead
approves/rejects (with feedback) → on rejection, teammate revises and resubmits → on approval, teammate exits plan
mode and implements.

The lead decides autonomously — steer it with criteria in your prompt, e.g. *"only approve plans that include test
coverage"* or *"reject plans that modify the database schema."*

### Talking to teammates directly

- **In-process**: arrow keys to select in the agent panel → Enter to view/message. `x` to stop a selected teammate.
  `Ctrl+T` toggles the task list.
- **Split-pane**: click into the teammate's pane directly.

While viewing an in-process teammate: plain text and skills go to *that teammate*; built-in commands still run in
the **lead's** session. `/model` and `/fast` always change the **lead's** settings (a notice says so as of
v2.1.199) — a teammate's model/fast-mode are fixed at spawn time. `/effort` does apply to the viewed teammate's
future turns (teammates follow the lead's effort level).

### Tasks: assign and claim

Shared task list coordinates work. States: **pending → in progress → completed**. Tasks can depend on other tasks;
a pending task with unresolved dependencies can't be claimed until they complete (auto-unblocks when dependencies
finish).

- **Lead assigns**: tell the lead which task goes to which teammate.
- **Self-claim**: teammate finishes a task, then picks up the next unassigned/unblocked task itself.

Task claiming uses file locking to avoid race conditions between teammates.

### Shutting down teammates

```
Ask the researcher teammate to shut down
```

Lead sends a shutdown request → teammate approves (exits gracefully) or rejects (with explanation). Team's shared
directories clean up automatically when the session ends — no manual cleanup step.

### Quality gates via hooks

- **`TeammateIdle`** — fires when a teammate is about to go idle; exit code 2 → send feedback, keep it working.
- **`TaskCreated`** — fires on task creation; exit code 2 → block creation, send feedback.
- **`TaskCompleted`** — fires when a task is marked complete; exit code 2 → block completion, send feedback.

---

## Architecture

An agent team consists of:

| Component | Role |
|---|---|
| **Team lead** | The main session; spawns teammates, coordinates work |
| **Teammates** | Separate Claude Code instances, each on assigned tasks |
| **Task list** | Shared work-item list teammates claim/complete |
| **Mailbox** | Inter-agent messaging system |

- Mailbox file: `~/.claude/teams/{team-name}/inboxes/{agent-name}.json` (JSON; malformed entries are dropped with
  an error, valid ones still deliver — fixed from a worse failure mode pre-v2.1.207 where one bad entry blocked
  the whole mailbox).
- Task dependencies unblock automatically when their prerequisite completes.
- **Naming**: team/task dirs are named `session-<first 8 chars of session ID>`.
  - Team config: `~/.claude/teams/{team-name}/config.json` — created at startup, **removed when session ends**.
  - Task list: `~/.claude/tasks/{team-name}/` — **persists locally**, never uploaded, so resumed sessions keep
    their tasks. Retention follows the same `cleanupPeriodDays` setting as session transcripts.
- **Do not hand-edit or pre-author the team config** — it holds runtime state (session IDs, tmux pane IDs) and gets
  overwritten on the next update. There is no project-level equivalent — a file like `.claude/teams/teams.json` in
  a project dir is just an ordinary file to Claude, not recognized config.
- Team config's `members` array lists each teammate's name/agent ID/agent type — teammates can read this to
  discover each other.

### Using subagent definitions as teammate roles

Reuse a named subagent definition (project/user/plugin/CLI-scoped) as a teammate role:

```
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

- Honors that definition's `tools` allowlist and `model`.
- The definition's body is **appended** to the teammate's system prompt (not a replacement).
- `SendMessage` and task-management tools are always available to a teammate, even under a restrictive `tools`
  allowlist.
- **Not applied**: a subagent definition's `skills` and `mcpServers` frontmatter fields are ignored when it runs as
  a teammate — teammates load skills/MCP servers from project & user settings like a normal session.

### Permissions

- Teammates start with the **lead's** permission settings (e.g. `--dangerously-skip-permissions` propagates to all
  teammates).
- You can change an individual teammate's mode after spawn, but **not** at spawn time per-teammate.
- Teammate permission prompts surface in the **lead session** — approve them there.
- A teammate **cannot** approve a permission prompt or give consent on your behalf, and one teammate being denied
  can't relay through another to bypass the check. In auto-mode, a relayed "approval claim" from another agent is
  treated as **untrusted input**, not as confirmation from you.
- Plan approval (see above) is the one designed exception: the lead grants a teammate's plan approval itself,
  without prompting you.

### Context and communication

- Each teammate gets its own context window; on spawn it loads the **same project context as a normal session**
  (CLAUDE.md, MCP servers, skills) plus the lead's spawn prompt — but **not** the lead's conversation history.
- **Message delivery is automatic** — no polling needed.
- **Idle notifications** — a teammate that finishes notifies the lead automatically. (v2.1.198+: a teammate whose
  turn ends via API error reports the failure + error text instead of looking like a normal finish.)
- **Shared task list** visible to all.
- **Direct messaging** — one recipient per message; to reach everyone, send once per teammate.
- The lead names every teammate at spawn; any teammate can message any other by name. Tell the lead what names to
  use if you want to reference specific teammates later in your own prompts.

### Token usage

Scales with number of active teammates — each is a fully separate context window. Worth it for research/review/new
feature work; a single session is more cost-effective for routine tasks.

---

## Use-case examples (verbatim patterns worth reusing)

### Parallel code review, split by lens

```
Spawn three teammates to review PR #142:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```
Why it works: a single reviewer tends to fixate on one issue type at a time; splitting into independent lenses gets
thorough simultaneous coverage. Lead synthesizes across all three afterward.

### Competing-hypothesis debugging

```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```
Why it works: sequential investigation anchors on the first plausible theory. Adversarial, parallel investigators
actively trying to disprove each other converge faster on the theory that actually survives scrutiny.

---

## Best practices

1. **Give teammates enough standalone context** — they don't inherit conversation history, so spell out specifics
   in the spawn prompt:
   ```
   Spawn a security reviewer teammate with the prompt: "Review the authentication module
   at src/auth/ for security vulnerabilities. Focus on token handling, session
   management, and input validation. The app uses JWT tokens stored in
   httpOnly cookies. Report any issues with severity ratings."
   ```
2. **Team size**: start with 3–5. Token cost scales linearly per teammate; coordination overhead grows with count;
   returns diminish past a point. **5–6 tasks per teammate** keeps everyone busy without excess context-switching —
   e.g. 15 independent tasks → 3 teammates is a good start. Three focused teammates usually beat five scattered ones.
3. **Size tasks right**: not so small that coordination overhead dominates; not so large that a teammate goes long
   stretches without checking in. Aim for self-contained units with a clear deliverable (a function, a test file, a
   review). If the lead isn't splitting work finely enough, tell it to break tasks smaller.
4. **Make the lead wait, not work**: if the lead starts implementing itself instead of delegating/waiting, say:
   ```
   Wait for your teammates to complete their tasks before proceeding
   ```
5. **Start with research/review, not implementation** — lower coordination risk while you learn the tool.
6. **Avoid file conflicts** — partition ownership so no two teammates edit the same file.
7. **Monitor and steer actively** — check progress, redirect bad approaches, synthesize as findings arrive; don't
   leave a team running unattended for long periods.

---

## Troubleshooting

- **Teammates not appearing**: check the agent panel (arrow keys + Enter); a "missing" row may just be idle-hidden —
  message the teammate by name to bring it back. Confirm the task was actually complex enough that Claude chose to
  spawn a team. For split-panes, verify `tmux` is on PATH (`which tmux`) or that iTerm2's `it2` CLI + Python API are
  set up.
- **Too many permission prompts**: teammate requests bubble up to the lead. Pre-approve common operations in
  permission settings before spawning to cut interruptions.
- **Teammates stopping on errors**: open their transcript (agent panel Enter, or click pane) and either give
  further instructions or spawn a replacement to continue. (v2.1.198+: a message from the lead/another teammate
  wakes an in-process teammate that's waiting to retry a failed API call, instead of waiting out the full delay.)
- **Lead shuts down early**: tell it to keep going / wait for teammates before wrapping up.
- **Orphaned tmux sessions**: `tmux ls` then `tmux kill-session -t <session-name>` to clean up manually.

---

## Limitations (experimental feature — know these before relying on it)

- **No session resumption for in-process teammates** — `/resume`/`/rewind` don't restore them; the lead may try to
  message teammates that no longer exist post-resume. Tell it to spawn new ones.
- **Task status can lag** — teammates sometimes fail to mark tasks complete, blocking dependents. Check manually or
  nudge the teammate/lead.
- **Shutdown can be slow** — a teammate finishes its current request/tool call first.
- **One team per session** — scoped to that session; no multiple named teams, no sharing a team across sessions.
- **No nested teams** — teammates can't spawn their own teammates; only the lead manages the team.
- **No background subagents from in-process teammates** — a teammate's own subagents run in the foreground only;
  requesting a background one (via `run_in_background` or a `background: true` subagent definition) errors,
  because it can't outlive the lead's process. (Subagents from the *main* conversation follow the normal
  foreground/background default.)
- **Lead is fixed** — can't promote a teammate to lead or transfer leadership mid-session.
- **Permissions fixed at spawn** — all teammates start with the lead's permission mode; per-teammate mode can only
  be changed *after* spawning, not specified at spawn time.
- **Split panes need tmux or iTerm2** — not supported in VS Code's integrated terminal, Windows Terminal, or
  Ghostty (in-process mode always works as a fallback).

**`CLAUDE.md` still works normally** — teammates read `CLAUDE.md` from their working directory, so project-specific
guidance (like this repo's own `CLAUDE.md`) reaches every teammate automatically.

---

## When NOT to reach for agent teams (self-check before spawning)

Given this repo is a small static site with no build step, most day-to-day tasks here (a copy edit, a CSS tweak, a
single-page fix) do **not** warrant a team — a single session is faster and cheaper. Reach for a team here only
when a task genuinely decomposes into independent, simultaneously-workable pieces, e.g.:

- Reviewing a large multi-page diff across distinct concerns (content accuracy, accessibility, SEO metadata,
  responsive layout) in parallel.
- Investigating a cross-page regression with multiple plausible causes (CSS cascade bug vs. asset path bug vs.
  stale cache) via competing hypotheses.
- Rolling out an identical structural change across all 6 pages, one teammate per page, when edits are independent
  and won't touch shared files simultaneously.

For anything sequential, single-file, or dependent on a prior step's output (which is most of this repo's typical
work), stick to a single session or a subagent.

## Related Claude Code concepts

- **Subagents** — lightweight, single-session delegation for research/verification; no inter-agent chat needed.
- **Git worktrees** — manual multi-session parallelism without automated coordination.
- **Hooks** (`TeammateIdle`, `TaskCreated`, `TaskCompleted`) — quality gates for team workflows.
