# DS Claude Harness

Personal ML/LLM Claude Code harness for Denis — curated fork of
[everything-claude-code](https://github.com/affaan-m/everything-claude-code)
tuned for LLM moderation, agent evaluation, and PyTorch workflows.

## Scope

- **Work profile (`ds-work`)** — LLM censor development, SQL read-only for
  evals/logs, TypeScript agents, Python/PyTorch pipelines.
- **Personal profile (`ds-personal`)** — everything in `ds-work` plus full DB
  stack (migrations) and deep-research skills.

This is a personal helper, **not** a regulated product. No guardrails/governance
layer — just curated agents, skills, and hooks.

## Install

```bash
# Work laptop (SQL read-only guidance)
npm install
node scripts/ecc.js install --profile ds-work --target claude --dry-run --json
node scripts/ecc.js install --profile ds-work --target claude

# Personal laptop (full DB + research)
node scripts/ecc.js install --profile ds-personal --target claude

# Runtime hook tuning
export ECC_HOOK_PROFILE=standard
export ECC_DISABLED_HOOKS="stop:format-typecheck"   # example
```

## Workflow

Follow global rules from `~/.claude/rules/common/*` — the harness does not
override them. Feature flow:

1. **Research** — GitHub code search → Context7 → Exa. Prefer adopting proven
   implementations over net-new code.
2. **Plan** — use `planner` agent before non-trivial work; persist via Plan mode.
3. **TDD** — `tdd-guide` agent; RED → GREEN → REFACTOR; 80%+ coverage.
4. **Review** — `python-reviewer` / `typescript-reviewer` / `security-reviewer`
   immediately after changes.
5. **Commit** — conventional messages in English. Never auto-commit (blocked by
   `.claude/settings.json`).

## Key agents

| Agent | Use |
|-------|-----|
| `pytorch-build-resolver` | Tensor/CUDA/gradient issues |
| `python-reviewer` / `typescript-reviewer` | Language-level review |
| `database-reviewer` | Postgres/ClickHouse SQL review |
| `security-reviewer` | OWASP, secrets, injection |
| `silent-failure-hunter` | Swallowed errors in inference |
| `gan-planner` / `gan-generator` / `gan-evaluator` | Adversarial eval loop |
| `harness-optimizer` | Tune this harness itself |
| `tdd-guide` / `pr-test-analyzer` | Test-first discipline |

## Key skills

- **Agents**: `agent-eval`, `agent-harness-construction`, `autonomous-loops`,
  `continuous-agent-loop`, `iterative-retrieval`, `prompt-optimizer`.
- **Context**: `strategic-compact`, `context-budget`, `continuous-learning-v2`.
- **Eval**: `eval-harness`, `gan-style-harness`, `ai-regression-testing`,
  `regex-vs-llm-structured-text`.
- **Safety**: `gateguard`, `safety-guard`, `security-review`, `security-scan`,
  `skill-comply`.
- **LLM API**: `claude-api`, `cost-aware-llm-pipeline`.
- **Python/ML**: `python-patterns`, `python-testing`, `pytorch-patterns`,
  `tdd-workflow`.
- **Data**: `clickhouse-io`, `postgres-patterns`, `database-migrations`
  (personal only).

## Smart compacting

| Layer | Artifact |
|-------|----------|
| Skill | `strategic-compact` — what to keep vs. compress |
| Skill | `context-budget` — audit current token spend |
| Hook | `pre:edit-write:suggest-compact` — nudges `/compact` when full |
| Hook | `pre:compact` — serializes state to `.claude/ecc/session-state.json` |
| Hook | `session:start` — restores working set after compact/restart |

## Continuous learning

Always on. `pre:observe:continuous-learning` + `post:observe:continuous-learning`
hooks (async, 10s) stream tool usage into
`skills/continuous-learning-v2/data/`. `stop:evaluate-session` scores the
session and distills instincts. Check current state via `/instinct-status`.

## Git safety

No agent or hook in this harness executes `git commit`, `git push`, or
`gh pr create`. As a second line of defence, `.claude/settings.json`
denies the patterns outright — Claude Code will ask before running them.

## Testing

```bash
npm test            # unicode-safety + validators + unit tests
npm run validate    # validators only
```

## MCP servers (6)

`context7`, `sequential-thinking`, `github`, `exa-web-search`, `playwright`,
`filesystem`. See `.mcp.json`.

## Stack conventions

- Node.js >= 18, CommonJS, no TypeScript transpilation.
- Python with Ruff/Black; PyTorch + Transformers for ML.
- ClickHouse for log evals; Postgres for app data.
- Communicate in Russian; code/commits/variables in English.
