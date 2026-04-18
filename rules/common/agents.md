# Agent Orchestration

## Available Agents

Located in `~/.claude/agents/`:

### Feature development pipeline

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `code-explorer` | Map existing code (execution flow, dependencies) | Starting work in an unfamiliar area |
| `code-architect` | Design new feature: files, interfaces, build order | After exploration or in a familiar area |
| `planner` | Product-level plan (requirements, phases, risks, success criteria) | Complex feature needing a written artifact |
| `tdd-guide` | RED → GREEN → REFACTOR, 80%+ coverage | New feature, bug fix |

### PR & code review

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `python-reviewer` | PEP 8, type hints, bandit, framework issues | On `git diff` after Python edits |
| `silent-failure-hunter` | Swallowed exceptions, bad fallbacks, lost stack traces | Every PR (language-agnostic) |
| `pr-test-analyzer` | Test coverage quality, behavioral coverage, real-bug prevention | Evaluating whether PR's tests are meaningful |
| `database-reviewer` | PostgreSQL query / schema / migration review | SQL, migrations, schema design |

### ML-specific

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `pytorch-build-resolver` | Tensor shape, CUDA, DataLoader, AMP, autograd fixes | PyTorch training / inference crashes |

### GAN-harness triplet (greenfield UI from a one-line brief)

| Agent | Purpose |
|-------|---------|
| `gan-planner` | Expand brief into `spec.md` + eval rubric |
| `gan-generator` | Implement features, run dev server, commit per iteration |
| `gan-evaluator` | Playwright-test the live app, score, write feedback files |

### Meta

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `harness-optimizer` | Edit hooks, settings, agent frontmatter, install manifests | Noisy/blocking hooks, cost pressure, post-upgrade regressions |

## Immediate Agent Usage

No user prompt needed — spawn automatically when the situation matches:

| Situation | Agent |
|-----------|-------|
| Complex feature request with written plan needed | `planner` |
| Feature in unfamiliar code area | `code-explorer` → `code-architect` |
| New feature or bug fix with tests | `tdd-guide` |
| PyTorch crash with traceback | `pytorch-build-resolver` |
| PR review on Python diff | `python-reviewer` + `silent-failure-hunter` (parallel) |
| Greenfield UI from a brief | `gan-planner` → `gan-generator` ⇄ `gan-evaluator` |

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Perspective Analysis

For complex problems, spawn multiple agents with distinct roles on the
same input and merge their outputs:

- `python-reviewer` — language quality
- `silent-failure-hunter` — error-handling correctness
- `pr-test-analyzer` — test coverage meaningfulness
- `security-review` skill — security triage

## Context Flow Between Subagents

Subagents receive **only**: their system prompt + global rules + the
`prompt` string passed via `Agent()`. They do **not** see the main
conversation, main agent's thinking, other subagents' results, or files
the main agent read.

Package every prior result you want them to use into the `prompt`
explicitly. For pipelines of 3+ steps, use artifact files
(e.g. `docs/<feature>/01-exploration.md`, `02-plan.md`, …) and pass file
paths instead of inlining large content.
