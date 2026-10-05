# DS Claude Harness

Personal ML/LLM Claude Code harness for Denis — curated fork of
[everything-claude-code](https://github.com/affaan-m/everything-claude-code)
tuned for LLM moderation, agent evaluation, and PyTorch workflows.

## Scope

- One harness, one machine, one `default` profile: LLM censor
  development, evals/logs analysis, Python/PyTorch pipelines, deep-research
  skills. The former ds-work / ds-personal split was merged on 2026-08-22.

This is a personal helper, **not** a regulated product. No guardrails/governance
layer — just curated agents, skills, and hooks.

## Install

```bash
npm install
node scripts/ecc.js install --profile default --target claude --dry-run --json
node scripts/ecc.js install --profile default --target claude

# Runtime hook tuning
export ECC_HOOK_PROFILE=standard
export ECC_DISABLED_HOOKS="post:quality-gate"   # example
```

## Workflow

Follow global rules from `~/.claude/rules/common/*` — the harness does not
override them. Feature flow:

1. **Research** — GitHub code search → Context7 → Exa. Prefer adopting proven
   implementations over net-new code.
2. **Plan** — use `planner` agent before non-trivial work; persist via Plan mode.
3. **TDD** — `tdd-guide` agent; RED → GREEN → REFACTOR; 80%+ coverage.
4. **Commit** — conventional messages in English. Never auto-commit (blocked by
   `.claude/settings.json`).

## Key agents

| Agent | Use |
|-------|-----|
| `pytorch-build-resolver` | Tensor/CUDA/gradient issues |
| `silent-failure-hunter` | Swallowed errors in inference |
| `harness-optimizer` | Tune this harness itself |
| `tdd-guide` / `pr-test-analyzer` | Test-first discipline |

## Key skills

Three, deliberately. A long skill list stops routing — the previous set of 31 never fired.

- `deep-research` — multi-source web research with the keenable / parallel / exa MCPs.
- `error-discovery` — error analysis over a prediction set: review UI, diverse sampling,
  clustering of failure modes.
- `scholar-evaluation` — judging a paper's methodology and evidence quality against a rubric.

`claude-api` is a Claude Code built-in, not part of this harness.

## Git safety

No agent or hook in this harness executes `git commit`, `git push`, or
`gh pr create`. As a second line of defence, `.claude/settings.json`
denies the patterns outright — Claude Code will ask before running them.

## Testing

```bash
npm run status      # show installed harness components
npm run doctor      # diagnose install state
```

## MCP servers (4)

`context7`, `exa-web-search`, `keenable`, `parallel`. See `.mcp.json`.

## Stack conventions

- Node.js >= 18, CommonJS, no TypeScript transpilation.
- Python with Ruff/Black; PyTorch + Transformers for ML.
- ClickHouse for log evals; Postgres for app data.
- Communicate in Russian; code/commits/variables in English.
