# ds-claude-harness

Personal ML/LLM Claude Code harness — a curated fork of
[everything-claude-code](https://github.com/affaan-m/everything-claude-code)
for data science work on LLM moderation and agent evaluation.

## Prerequisites

- **Node.js** ≥ 18 (`node --version`)
- **Claude Code CLI** (`claude --version`) — run `claude` once so it creates `~/.claude/settings.json`
- **`jq`** for the post-install merges — `brew install jq` on macOS
- MCP env vars in `~/.zshrc`: `GITHUB_PERSONAL_ACCESS_TOKEN`, `EXA_API_KEY` (see step 2)

## Quick start

```bash
npm install

# Work laptop — LLM censor dev, SQL read-only
node scripts/ecc.js install --profile ds-work --target claude

# Personal laptop — full DB stack + research APIs
node scripts/ecc.js install --profile ds-personal --target claude
```

The ECC installer copies agents, skills, commands, rules, and hook scripts into
`~/.claude/`. Hooks, MCP servers, and `permissions.deny` are **not** activated
by the installer — Claude Code does not auto-discover `~/.claude/hooks/hooks.json`
or `.claude/settings.json` inside a source repo. Run the post-install steps below.

## Post-install steps

### 1. Activate hooks

Claude Code only loads hooks from `~/.claude/settings.json` (user scope) or from
an installed plugin. Merge the hook config that ECC wrote to
`~/.claude/hooks/hooks.json` into user settings:

```bash
jq -s '.[0] * {hooks: .[1].hooks}' \
  ~/.claude/settings.json ~/.claude/hooks/hooks.json \
  > ~/.claude/settings.json.tmp \
  && mv ~/.claude/settings.json.tmp ~/.claude/settings.json \
  && rm ~/.claude/hooks/hooks.json
```

The obfuscated bootstrap preamble inside each hook command resolves
`CLAUDE_PLUGIN_ROOT` to `~/.claude` because ECC already placed
`scripts/lib/utils.js` there — no further rewriting needed.

### 2. Register MCP servers

MCP servers are stored in `~/.claude.json`, not `settings.json`. Use
`claude mcp add` at user scope for always-on servers; keep opt-in servers
in per-project `.mcp.json` files.

```bash
# Always-on at user scope
claude mcp add context7            --scope user -- npx -y @upstash/context7-mcp@latest
claude mcp add sequential-thinking --scope user -- npx -y @modelcontextprotocol/server-sequential-thinking
claude mcp add github              --scope user --env GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PERSONAL_ACCESS_TOKEN -- npx -y @modelcontextprotocol/server-github
claude mcp add exa-web-search      --scope user --env EXA_API_KEY=$EXA_API_KEY -- npx -y exa-mcp-server
claude mcp add filesystem          --scope user -- npx -y @modelcontextprotocol/server-filesystem "$HOME/projects"

# Project-scoped (playwright) — copy .mcp.json into projects that need it
cp .mcp.json /path/to/some-project/
```

Required env variables (put in `~/.zshrc` before starting Claude Code):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
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

### 5. Continuous-learning storage (one-time, per machine)

Claude Code 2.1.x blocks sub-Claude `Write` calls on any path starting with
`~/.claude/` in headless (`--print`) mode. The `continuous-learning-v2`
observer writes instincts into `~/.claude/homunculus/projects/<id>/instincts/`,
which is exactly such a path. Without the workaround below, the observer
collects observations but never produces instinct files.

Fix: move the homunculus storage out of `~/.claude/` and symlink it back.
Scripts auto-resolve through the symlink via `readlink -f`.

```bash
# Stop the observer daemon if running
bash ~/.claude/skills/continuous-learning-v2/agents/start-observer.sh stop

# Migrate storage out of ~/.claude/ (idempotent — safe to re-run)
if test -L "$HOME/.claude/homunculus"; then
  echo "already migrated"
elif test -d "$HOME/.claude/homunculus" && ! test -e "$HOME/homunculus"; then
  mv "$HOME/.claude/homunculus" "$HOME/homunculus"
  ln -s "$HOME/homunculus" "$HOME/.claude/homunculus"
elif ! test -e "$HOME/.claude/homunculus" && ! test -e "$HOME/homunculus"; then
  mkdir -p "$HOME/homunculus"
  ln -s "$HOME/homunculus" "$HOME/.claude/homunculus"
else
  echo "conflict: both ~/.claude/homunculus and ~/homunculus exist — resolve manually"
fi

# Restart daemon (picks up resolved path)
bash ~/.claude/skills/continuous-learning-v2/agents/start-observer.sh start
```

Verify: within one analysis cycle (~5 min, or force with `kill -USR1 $(cat
~/homunculus/projects/*/.observer.pid)`), `.md` files should appear under
`~/homunculus/projects/<id>/instincts/personal/`. Check `/instinct-status`
inside Claude Code to see extracted insights.

## What's inside

| Component | Count |
|-----------|-------|
| Agents | 13 — pytorch/python reviewers, GAN loop, planners, code explorers |
| Skills | 31 — agent eval, strategic compact, PyTorch, LLM cost, security |
| Commands | 1 — `/instinct-status` |
| Hooks | 15 — safety, quality-gate, smart compacting, continuous learning |
| MCP servers | 6 — context7, sequential-thinking, github, exa, playwright, filesystem |

## Profiles

- **`ds-work`** — work laptop. Read-only SQL, LLM censor-module stack.
- **`ds-personal`** — personal laptop. Adds `database-migrations` and
  `deep-research`.

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
agents/      13 specialized subagents
skills/      31 workflow + domain skills
commands/    1 slash command (/instinct-status)
hooks/       15 lifecycle hooks (hooks.json)
rules/       common + python + typescript
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

## Continuous learning

`continuous-learning-v2` passively collects session patterns and surfaces
them as instinct files. Two-layer model: **raw instincts** (auto-written by
the observer) → **learned skills** (manually promoted by you).

### Storage

```
~/homunculus/                              # symlinked from ~/.claude/homunculus
├── projects/<id>/
│   ├── instincts/personal/    ← raw *.md from observer
│   ├── instincts/inherited/   ← copied from other projects
│   ├── evolved/{skills,agents,commands}/  ← CLI-generated drafts
│   └── observations.jsonl
└── instincts/                 ← global scope (cross-project)
```

### View

```bash
/instinct-status                                       # grouped by domain
cat ~/homunculus/projects/<id>/instincts/personal/*.md # raw bodies
```

### Workflow (3 levels)

1. **Daily** — `/instinct-status` to skim recent patterns.
2. **Weekly** — evolve mature ones into skill/agent drafts:
   ```bash
   python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve --generate
   ```
   Drafts appear in `~/homunculus/projects/<id>/evolved/`.
3. **Monthly** — promote what you actually use:
   - Cross-project? `instinct-cli.py promote <id>` (project → global).
   - Battle-tested? Copy into a real skill:
     ```bash
     mkdir -p ~/.claude/skills/learned/<name>
     cp ~/homunculus/projects/<id>/evolved/skills/<name>.md \
        ~/.claude/skills/learned/<name>/SKILL.md
     # Edit: tighten trigger, add examples, remove auto-generated boilerplate
     ```
   - Want it to survive `ecc.js install` and sync across machines?
     Put the finished skill in the repo: `skills/<name>/SKILL.md`, commit.

### Confidence threshold

Observer assigns 0.3–0.85 based on frequency. Rule of thumb:

- `< 0.5` — noise, let it expire (`instinct-cli.py prune`).
- `0.5–0.7` — watch, don't act.
- `≥ 0.7` — candidate for `evolve`.
- `≥ 0.85` — candidate for `promote` to global or `learned/`.

## License

MIT — same as upstream.
