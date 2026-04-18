---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python Hooks

> This file extends [common/hooks.md](../common/hooks.md) with Python specific content.

## Installed Hooks That Act on Python Files

| ID | Event | Effect |
|----|-------|--------|
| `post:quality-gate` | PostToolUse | Runs `ruff` / `mypy` / `bandit` if configured in `pyproject.toml` |
| `pre:config-protection` | PreToolUse | Blocks edits of `pyproject.toml`, `ruff.toml`, `.mypy.ini`, `.bandit` |
| `pre:edit-write:gateguard-fact-force` | PreToolUse | Fact-forcing gate on first edit per `.py` |

## Warnings

- Prefer the `logging` module over `print()` in non-CLI code
