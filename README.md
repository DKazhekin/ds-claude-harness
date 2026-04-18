# ds-claude-harness

Personal ML/LLM Claude Code harness — a curated fork of
[everything-claude-code](https://github.com/affaan-m/everything-claude-code)
for data science work on LLM moderation and agent evaluation.

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

## What's inside

| Component | Count |
|-----------|-------|
| Agents | 16 — pytorch/python/ts reviewers, GAN loop, planners, error resolvers |
| Skills | 34 — agent eval, strategic compact, PyTorch, LLM cost, safety |
| Commands | 10 — `/tdd`, `/plan`, `/eval`, `/harness-audit`, `/instinct-status`, … |
| Hooks | 15 — safety, quality-gate, smart compacting, continuous learning |
| MCP servers | 6 — context7, sequential-thinking, github, exa, playwright, filesystem |

## Profiles

- **`ds-work`** — work laptop. Read-only SQL, LLM censor-module stack.
- **`ds-personal`** — personal laptop. Adds `database-migrations` and
  `deep-research`.

## Git safety

`.claude/settings.json` denies `git commit`, `git push`, `gh pr create/merge`,
etc. No agent or hook in the harness auto-commits.

## Testing

```bash
npm test            # unicode-safety + validators + unit tests
npm run validate    # validators only
npm run harness:audit
```

## Layout

```
agents/      16 specialized subagents
skills/      34 workflow + domain skills
commands/    10 slash commands
hooks/       15 lifecycle hooks (hooks.json)
rules/       common + python + typescript
manifests/   install-profiles.json, install-modules.json
mcp-configs/ mcp-servers.json
scripts/     ECC install system (CommonJS)
tests/       CI validators + unit tests
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

## License

MIT — same as upstream.
