# Hooks System

## Registered Hooks

Two. Everything else was removed on 2026-08-21 after measuring what each hook
actually produced.

| ID | Event | Matcher | Purpose |
|----|-------|---------|---------|
| `post:quality-gate` | PostToolUse | `Edit\|Write\|MultiEdit` | Formats the edited file — `ruff format` for Python, biome for JS/TS/JSON/MD |
| `pre:bash:dispatcher` | PreToolUse | `Bash` | Runs the destructive-command gate (below) |

Source of truth: `hooks/hooks.json` in this repo, merged into `~/.claude/settings.json`
by the post-install step. Claude Code reads hooks only from `settings.json`.

## Destructive-Command Gate (GateGuard)

`pre:bash:gateguard-fact-force`, dispatched from the Bash preflight, blocks the **first**
attempt at a destructive command and asks three questions before the retry:

1. **What, resolved** — the actual list, not the glob or directory name
2. **Who references it** — grep first; hooks, manifests and configs point at files
   that look unused
3. **Why now** — whose request, and does it need deletion rather than a move

The point is the second question. On 2026-08-21 it caught a real mistake: two registered
hooks lived *inside* a skill directory queued for deletion, and removing it wholesale
would have silently broken them.

Answering is not verified — the hook marks the command as seen and lets the retry pass.
It buys a turn of deliberate thought, not a proof.

Matched commands: `rm -rf`, `git reset --hard`, `git checkout --`, `git clean -f`,
`drop table`, `delete from`, `truncate`, `git push --force`, `dd if=`.

The gate keys on a hash of the exact command, so a re-worded command is gated again.
Routine Bash commands pass through untouched — the session-wide "quote the instruction"
gate was removed 2026-08-21 as pure friction.

State file: `~/.gateguard/state-<session_id>.json`.

### Why the gate exists at all

`permissions.deny` (14 rules, in both `~/.claude/settings.json` and this repo's
`.claude/settings.json`) covers **git and gh only**: commits, pushes, hard resets,
forced cleans, checkout discards, branch drops, PR create/merge/close.

There is **no deny rule for file deletion** — not globally, not in any project. Four of
the gate's nine patterns are therefore already blocked outright by deny; the SQL verbs
only ever appear in notebooks and Python, where a Bash hook cannot see them. What the
gate actually guards is recursive file removal and raw disk writes.

Kept deliberately (decision 2026-08-21) rather than adding a deny rule for removal,
because the mechanisms differ: deny forbids outright and cannot be argued with, so
routine cleanup of temp files and stale directories would have to move to the human.
The gate lets the work proceed while forcing the deletion to be spelled out first.

Known false positive: the gate matches on command *text*, not on what the command does.
Appending documentation that merely quotes the dangerous verbs trips it — this happened
three times while writing this very file.


### Deletion journal

Every destructive command that actually runs is appended to `~/.claude/deletions.log`
with an ISO timestamp, so removals leave a trace outside the conversation. Writing to it
never blocks the command. Note that false positives land there too — the log records what
the pattern matched, not what was destroyed.

## Quality Gate

Runs after every successful edit. Behaviour depends on two environment variables:

| Variable | Effect |
|----------|--------|
| `ECC_QUALITY_GATE_FIX=true` | Rewrites the file (`ruff format`), instead of only checking it |
| `ECC_QUALITY_GATE_STRICT=true` | Logs failures to stderr; otherwise failures are silent |

`ECC_QUALITY_GATE_FIX=true` is set from `~/.zshrc`; `ECC_QUALITY_GATE_STRICT` is not set
anywhere, so formatting failures are currently silent. Without `FIX`, the hook checks and
stays silent — which looks identical to doing nothing.

## Runtime Controls

| Variable | Effect |
|----------|--------|
| `ECC_DISABLED_HOOKS` | Comma-separated hook IDs to skip. IDs must match exactly — a hook registered under two IDs needs both listed |
| `ECC_HOOK_PROFILE` | `minimal` / `standard` / `strict`; unset behaves as `standard` |
| `CLAUDE_PLUGIN_ROOT` | Override plugin root resolution |

## What was removed and why

| Hook | Reason |
|------|--------|
| `pre:observe` / `post:observe` / observer startup | The instinct observer exited immediately on every launch since 31 Jul ("Observer idle ... for 1787329445s"); zero instincts across ten projects, while both hooks fired on *every* tool call |
| `stop:evaluate-session` | Wrote into `skills/learned`, empty for its whole lifetime |
| `stop:session-end` + `session:start` | Produced the previous-session summary; not wanted |
| `pre:compact` | Despite its name, saved no state — it appended two lines to a log |
| `pre:edit-write:suggest-compact` | Suggested `/compact` every 50 tool calls; meaningless at a 1M context |
| `pre:mcp-health-check` / `post:mcp-health-check` | 120-second status cache across four servers |
| `pre:config-protection` | Guarded linter configs; never fired once |
| `pre:bash:block-no-verify`, `git-push-reminder`, `commit-quality` | Redundant with `permissions.deny` |
| `pre:bash:auto-tmux-dev`, `tmux-reminder` | Target dev servers this project does not run |
| Four `post:bash:*` hooks (command log, cost tracker, pr-created, build-complete) | Never invoked — no `PostToolUse` matcher for `Bash` was ever registered |
