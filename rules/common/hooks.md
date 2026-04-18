# Hooks System

## Lifecycle Events

| Event | Fires | Can block? |
|-------|-------|------------|
| `PreToolUse` | Before a tool call | Yes — non-zero exit blocks |
| `PreCompact` | Before context compaction | No |
| `SessionStart` | New session / `/resume` | No |
| `PostToolUse` | After a successful tool call | No |
| `PostToolUseFailure` | After a failed tool call | No |
| `Stop` | End of each assistant turn | No |
| `SessionEnd` | Session terminates | No |

## Registered Hooks

| ID | Event | Matcher | Purpose |
|----|-------|---------|---------|
| `pre:bash:dispatcher` | PreToolUse | `Bash` | Bash preflight — quality, tmux, push, GateGuard |
| `pre:edit-write:suggest-compact` | PreToolUse | `Edit\|Write` | Suggest `/compact` at logical intervals |
| `pre:observe:continuous-learning` | PreToolUse | `*` | Observer — append tool use to `observations.jsonl` |
| `pre:config-protection` | PreToolUse | `Write\|Edit\|MultiEdit` | Block edits of linter/formatter configs |
| `pre:mcp-health-check` | PreToolUse | `*` | Block MCP calls against unhealthy servers |
| `pre:edit-write:gateguard-fact-force` | PreToolUse | `Edit\|Write\|MultiEdit` | First edit per file → 4 facts required |
| `pre:compact` | PreCompact | `*` | Persist state before compaction |
| `session:start` | SessionStart | `*` | Load previous summary, detect package manager |
| `post:quality-gate` | PostToolUse | `Edit\|Write\|MultiEdit` | Run project quality gate after edits |
| `post:observe:continuous-learning` | PostToolUse | `*` | Observer — append tool-use results |
| `post:mcp-health-check` | PostToolUseFailure | `*` | Mark MCP server unhealthy, attempt reconnect |
| `stop:session-end` | Stop | `*` | Persist session state + transcript pointer |
| `stop:evaluate-session` | Stop | `*` | Evaluate session for learnable patterns |
| `session:end:marker` | SessionEnd | `*` | Session-end marker |

Source of truth: `~/.claude/hooks/hooks.json`.

## Fact-Forcing Gate (GateGuard)

`pre:edit-write:gateguard-fact-force` blocks the first `Edit` / `Write` /
`MultiEdit` per file and demands 4 facts:

1. Importers / callers of the target
2. No other file serves the same purpose (Glob check)
3. Data shape being read / written
4. Verbatim user instruction

State file: `~/.gateguard/state-<session_id>.json`.

## Continuous Learning Observer

`pre:observe:*` / `post:observe:*` stream events to
`~/.claude/homunculus/projects/<project_id>/observations.jsonl`. Inspect
extracted instincts via `/instinct-status`.

## Runtime Controls

| Variable | Effect |
|----------|--------|
| `ECC_DISABLED_HOOKS` | Comma-separated hook IDs to skip |
| `ECC_HOOK_PROFILE` | `minimal` / `standard` / `strict` |
| `CLAUDE_PLUGIN_ROOT` | Override plugin root resolution |

## Auto-Accept Permissions

Use with caution:
- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use dangerously-skip-permissions flag
- Configure `allowedTools` in `~/.claude.json` instead

## TodoWrite Best Practices

Use TodoWrite tool to:
- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps

Todo list reveals:
- Out of order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements
