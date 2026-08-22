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
| `post:quality-gate` | PostToolUse | Runs `ruff format` on the edited file — `--check` only unless `ECC_QUALITY_GATE_FIX=true`; failures logged to stderr only when `ECC_QUALITY_GATE_STRICT=true` |

## Warnings

- Prefer the `logging` module over `print()` in non-CLI code
