# ds-claude-harness

Personal ML/LLM Claude Code harness — a curated fork of
[everything-claude-code](https://github.com/affaan-m/everything-claude-code)
for data science work on LLM moderation and agent evaluation.

## Prerequisites

- **Node.js** ≥ 18 (`node --version`)
- **Claude Code CLI** (`claude --version`) — run `claude` once so it creates `~/.claude/settings.json`
- **`jq`** for the post-install merges — `brew install jq` on macOS
- MCP env var in `~/.zshrc`: `EXA_API_KEY` (see step 2)

## Quick start

```bash
npm install

# Same command on every machine
node scripts/ecc.js install --profile default --target claude
```

The ECC installer copies agents, skills, rules, and hook scripts into
`~/.claude/`. Hooks, MCP servers, and `permissions.deny` are **not** activated
by the installer — Claude Code does not auto-discover hook configs
or `.claude/settings.json` inside a source repo. Run the post-install steps below.

## Post-install steps

### 1. Activate hooks

Claude Code only loads hooks from `~/.claude/settings.json` (user scope) or from
an installed plugin. Merge the hook config from this repo's
`hooks/hooks.json` into user settings (run from the clone root):

```bash
jq -s '.[0] * {hooks: .[1].hooks}' \
  ~/.claude/settings.json hooks/hooks.json \
  > ~/.claude/settings.json.tmp \
  && mv ~/.claude/settings.json.tmp ~/.claude/settings.json
```

The obfuscated bootstrap preamble inside each hook command resolves
`CLAUDE_PLUGIN_ROOT` to `~/.claude` because ECC already placed
`scripts/lib/utils.js` there — no further rewriting needed.

### 2. Register MCP servers

MCP servers are stored in `~/.claude.json`, not `settings.json`. Use
`claude mcp add` at user scope for always-on servers; keep opt-in servers
in per-project `.mcp.json` files.

> **Load secrets first.** `--env KEY=$VAR` is expanded by your shell at the moment
> you type it. In a shell where the variable is not exported yet it expands to an
> empty string, and an empty value in a server's `env` block *overrides* the
> inherited process environment — the server then fails with 401 and nothing
> reports it until a tool is actually called. Run `source ~/.config/secrets.env`
> (or open a fresh login shell) before the commands below, and verify afterwards
> that the values in `~/.claude.json` are non-empty.

```bash
source ~/.config/secrets.env   # must come first, see the warning above

# Library docs
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp@latest

# Web search — exa needs a key, the other two work anonymously
claude mcp add exa-web-search --scope user --env EXA_API_KEY=$EXA_API_KEY -- npx -y exa-mcp-server
claude mcp add keenable --transport http https://api.keenable.ai/mcp     --scope user
claude mcp add parallel --transport http https://search.parallel.ai/mcp  --scope user
```

Deliberately **not** installed, after measuring actual usage: `sequential-thinking`
(0 calls in two months), `github` (duplicates the `gh` CLI, which the rules use anyway),
`filesystem` (scoped to `~/projects` while the work lives in `~/Downloads`).

Required env variables (put in `~/.zshrc` before starting Claude Code):

```bash
export EXA_API_KEY=...
```

Toggle servers per-session via `/mcp`. Persistent disable is not supported —
use `claude mcp remove <name> --scope user` to drop a server.

### 3. Apply git-safety permissions.deny

Merge the 14 rules from this repo's `.claude/settings.json` into user settings:

```bash
jq -s '.[0] as $u
  | .[1].permissions.deny as $new
  | $u * {permissions: ($u.permissions // {}) * {deny: (($u.permissions.deny // []) + $new | unique)}}' \
  ~/.claude/settings.json .claude/settings.json \
  > ~/.claude/settings.json.tmp \
  && mv ~/.claude/settings.json.tmp ~/.claude/settings.json
```

### 4. Verify

```bash
jq '.hooks | keys' ~/.claude/settings.json      # hooks loaded
claude mcp list                                  # MCP servers registered
jq '.permissions.deny | map(select(startswith("Bash(git commit") or startswith("Bash(gh pr")))' \
  ~/.claude/settings.json                        # git-safety applied
```

### 5. Removed subsystems

The instinct observer (`continuous-learning-v2`) and its three hooks were removed on
2026-08-21: the observer exited immediately on every launch since 31 July and produced
zero instincts across ten projects. `~/homunculus` and the `~/.claude/homunculus`
symlink are left in place — they hold old logs and nothing reads them any more.

## What's inside


| Component   | Count                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Agents      | 9 — pytorch/python reviewers, planners, code explorers                 |
| Skills      | 3 — deep research, error analysis, scholarly evaluation                |
| Commands    | 0                                                                      |
| Hooks       | 2 — destructive-command gate, quality-gate (ruff format)               |
| MCP servers | 4 — context7, exa, keenable, parallel                                  |


## Profiles

- **default** — the only profile; the same harness on every machine. The former
ds-work / ds-personal split was merged on 2026-08-22: their module sets had
become identical, so the distinction carried no information.

## Git safety

`.claude/settings.json` denies `git commit`, `git push`, `gh pr create/merge`,
etc. No agent or hook in the harness auto-commits.

## Maintenance

```bash
npm run status      # show installed harness components
npm run doctor      # diagnose install state
npm run uninstall   # remove harness from ~/.claude
```

## Layout

```
agents/      9 specialized subagents
skills/      3 curated skills
hooks/       2 lifecycle hooks (hooks.json)
rules/       common + python
manifests/   install-profiles.json, install-modules.json
mcp-configs/ mcp-servers.json
scripts/     ECC install system (CommonJS)
.claude/     settings.json with permissions.deny
.mcp.json    MCP config for Claude Code
```

## Updating from upstream

One-off, quarterly:

```bash
git remote add upstream https://github.com/affaan-m/everything-claude-code.git
git fetch upstream
# review scripts/curate.js whitelist, re-run, merge manually
```

## Agent pipelines

How the 9 subagents typically compose. Subagents receive **only** their
prompt string — no main conversation, no other agents' outputs. The
orchestrator must package each prior result into the next prompt.

| Scenario | Chain |
|---|---|
| Feature in unfamiliar area | `code-explorer → planner → code-architect → tdd-guide` |
| Feature in familiar area | `code-architect → tdd-guide` |
| PR review (parallel) | `python-reviewer ∥ silent-failure-hunter` on same diff |

**Artifact pattern for ≥3-step pipelines** — each agent reads/writes a file:

```
docs/<feature>/
  01-exploration.md   (code-explorer)
  02-plan.md          (planner)
  03-architecture.md  (code-architect)
  04-tests/           (tdd-guide)
```

Benefits: doesn't bloat main context, git-trackable, resumable across days.

**Role boundaries**: `explorer` stops at "how it works now", `architect`
designs new code, `planner` = product-level, `tdd-guide` = tests-first,
`harness-optimizer` = meta (edits this harness itself).

## Memory architecture

Two classes of state: **live channels** (auto-loaded every session) and
**passive storage** (needs manual promotion).

### Live (auto-loaded)

| Channel | Path |
|---|---|
| Global instructions | `~/.claude/CLAUDE.md` |
| Global rules (path-filtered) | `~/.claude/rules/**/*.md` |
| Project instructions | `<cwd>/CLAUDE.md` |
| Auto-memory | `~/.claude/projects/<id>/memory/*.md` + `MEMORY.md` |
| Session summary | previous-session JSONL via `SessionStart` hook |

### Passive (not auto-loaded)

| Store | Path | Writer |
|---|---|---|
| GateGuard state | `~/.gateguard/state-<session>.json` | fact-force hook |

## License

MIT — same as upstream.