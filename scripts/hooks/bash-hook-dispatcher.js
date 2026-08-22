#!/usr/bin/env node
'use strict';

const { isHookEnabled } = require('../lib/hook-flags');

const { run: runGateGuard } = require('./gateguard-fact-force');

const MAX_STDIN = 1024 * 1024;

// Only the destructive-command gate remains. Everything else that used to live here was
// removed 2026-08-21: git protections are covered by permissions.deny in settings.json
// (git commit / push / reset --hard / clean -fd / checkout -- / gh pr create|merge),
// tmux helpers target dev servers this project does not run, and the post-bash hooks
// (command log, cost tracker, pr-created, build-complete) were never invoked because no
// PostToolUse matcher for Bash was ever registered.
const PRE_BASH_HOOKS = [
  {
    id: 'pre:bash:gateguard-fact-force',
    profiles: 'standard,strict',
    run: rawInput => runGateGuard(rawInput),
  },
];

function readStdinRaw() {
  return new Promise(resolve => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      if (raw.length < MAX_STDIN) {
        const remaining = MAX_STDIN - raw.length;
        raw += chunk.substring(0, remaining);
      }
    });
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(raw));
  });
}

function normalizeHookResult(previousRaw, output) {
  if (typeof output === 'string' || Buffer.isBuffer(output)) {
    return {
      raw: String(output),
      stderr: '',
      exitCode: 0,
    };
  }

  if (output && typeof output === 'object') {
    const nextRaw = Object.prototype.hasOwnProperty.call(output, 'stdout')
      ? String(output.stdout ?? '')
      : !Number.isInteger(output.exitCode) || output.exitCode === 0
        ? previousRaw
        : '';

    return {
      raw: nextRaw,
      stderr: typeof output.stderr === 'string' ? output.stderr : '',
      exitCode: Number.isInteger(output.exitCode) ? output.exitCode : 0,
    };
  }

  return {
    raw: previousRaw,
    stderr: '',
    exitCode: 0,
  };
}

function runHooks(rawInput, hooks) {
  let currentRaw = rawInput;
  let stderr = '';

  for (const hook of hooks) {
    if (!isHookEnabled(hook.id, { profiles: hook.profiles })) {
      continue;
    }

    try {
      const result = normalizeHookResult(currentRaw, hook.run(currentRaw));
      currentRaw = result.raw;
      if (result.stderr) {
        stderr += result.stderr.endsWith('\n') ? result.stderr : `${result.stderr}\n`;
      }
      if (result.exitCode !== 0) {
        return { output: currentRaw, stderr, exitCode: result.exitCode };
      }
    } catch (error) {
      stderr += `[Hook] ${hook.id} failed: ${error.message}\n`;
    }
  }

  return { output: currentRaw, stderr, exitCode: 0 };
}

function runPreBash(rawInput) {
  return runHooks(rawInput, PRE_BASH_HOOKS);
}

async function main() {
  const raw = await readStdinRaw();
  const result = runPreBash(raw);

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.stdout.write(result.output);
  process.exit(result.exitCode);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`[Hook] bash-hook-dispatcher failed: ${error.message}\n`);
    process.exit(0);
  });
}

module.exports = {
  PRE_BASH_HOOKS,
  runPreBash,
};
