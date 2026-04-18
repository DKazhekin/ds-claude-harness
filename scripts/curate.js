#!/usr/bin/env node
/*
 * curate.js — idempotent copier that populates ds-claude-harness from upstream
 * everything-claude-code. Re-runnable whenever the whitelist changes.
 *
 * Usage:
 *   UPSTREAM=/path/to/everything-claude-code node scripts/curate.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const UPSTREAM = process.env.UPSTREAM || '/home/dench/Downloads/everything-claude-code';
const DEST = path.resolve(__dirname, '..');

const AGENTS = [
  'pytorch-build-resolver',
  'python-reviewer',
  'database-reviewer',
  'silent-failure-hunter',
  'gan-planner',
  'gan-generator',
  'gan-evaluator',
  'harness-optimizer',
  'tdd-guide',
  'pr-test-analyzer',
  'planner',
  'code-architect',
  'code-explorer',
];

const SKILLS = [
  'agent-eval',
  'agent-harness-construction',
  'agent-introspection-debugging',
  'agentic-engineering',
  'autonomous-loops',
  'continuous-agent-loop',
  'iterative-retrieval',
  'prompt-optimizer',
  'strategic-compact',
  'continuous-learning-v2',
  'eval-harness',
  'gan-style-harness',
  'ai-regression-testing',
  'skill-comply',
  'regex-vs-llm-structured-text',
  'gateguard',
  'safety-guard',
  'security-review',
  'security-scan',
  'claude-api',
  'cost-aware-llm-pipeline',
  'python-testing',
  'python-patterns',
  'pytorch-patterns',
  'tdd-workflow',
  'clickhouse-io',
  'postgres-patterns',
  'database-migrations',
  'coding-standards',
  'git-workflow',
  'context-budget',
  'documentation-lookup',
  'deep-research',
  'mcp-server-patterns',
];

const COMMANDS = [
  'tdd',
  'plan',
  'eval',
  'instinct-status',
  'harness-audit',
  'code-review',
  'python-review',
  'context-budget',
  'quality-gate',
  'learn',
  'build-fix',
];

const RULE_DIRS = ['common', 'python', 'typescript'];

const TOP_SCRIPTS = [
  'ecc.js',
  'install-apply.js',
  'install-plan.js',
  'catalog.js',
  'doctor.js',
  'repair.js',
  'status.js',
  'list-installed.js',
  'uninstall.js',
  'harness-audit.js',
  'setup-package-manager.js',
  'skills-health.js',
];

const INSTALL_FILES = ['install.sh', 'install.ps1'];

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dst, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) count += copyDir(s, d);
    else if (entry.isFile()) {
      fs.copyFileSync(s, d);
      count += 1;
    }
  }
  return count;
}

function log(label, value) {
  process.stdout.write(`[curate] ${label}: ${value}\n`);
}

function copyAgents() {
  let missing = 0;
  for (const name of AGENTS) {
    const src = path.join(UPSTREAM, 'agents', `${name}.md`);
    const dst = path.join(DEST, 'agents', `${name}.md`);
    if (!fs.existsSync(src)) {
      process.stderr.write(`[curate] MISSING agent: ${name}\n`);
      missing += 1;
      continue;
    }
    copyFile(src, dst);
  }
  log('agents copied', `${AGENTS.length - missing}/${AGENTS.length}`);
}

function copySkills() {
  let total = 0;
  for (const name of SKILLS) {
    const src = path.join(UPSTREAM, 'skills', name);
    const dst = path.join(DEST, 'skills', name);
    if (!fs.existsSync(src)) {
      process.stderr.write(`[curate] MISSING skill: ${name}\n`);
      continue;
    }
    total += copyDir(src, dst);
  }
  log('skill files copied', total);
}

function copyCommands() {
  for (const name of COMMANDS) {
    const src = path.join(UPSTREAM, 'commands', `${name}.md`);
    const dst = path.join(DEST, 'commands', `${name}.md`);
    if (!fs.existsSync(src)) {
      process.stderr.write(`[curate] MISSING command: ${name}\n`);
      continue;
    }
    copyFile(src, dst);
  }
  log('commands copied', COMMANDS.length);
}

function copyRules() {
  for (const dir of RULE_DIRS) {
    copyDir(path.join(UPSTREAM, 'rules', dir), path.join(DEST, 'rules', dir));
  }
  log('rules dirs', RULE_DIRS.join(', '));
}

function copyScripts() {
  for (const name of TOP_SCRIPTS) {
    const src = path.join(UPSTREAM, 'scripts', name);
    if (fs.existsSync(src)) copyFile(src, path.join(DEST, 'scripts', name));
  }
  const libCount = copyDir(path.join(UPSTREAM, 'scripts', 'lib'), path.join(DEST, 'scripts', 'lib'));
  const hooksCount = copyDir(path.join(UPSTREAM, 'scripts', 'hooks'), path.join(DEST, 'scripts', 'hooks'));
  const ciCount = copyDir(path.join(UPSTREAM, 'scripts', 'ci'), path.join(DEST, 'scripts', 'ci'));
  log('scripts/lib files', libCount);
  log('scripts/hooks files', hooksCount);
  log('scripts/ci files', ciCount);
}

function copyInstallers() {
  for (const name of INSTALL_FILES) {
    const src = path.join(UPSTREAM, name);
    if (fs.existsSync(src)) copyFile(src, path.join(DEST, name));
  }
  log('installers', INSTALL_FILES.join(', '));
}

function copyTests() {
  const count = copyDir(path.join(UPSTREAM, 'tests'), path.join(DEST, 'tests'));
  log('tests files', count);
}

function main() {
  if (!fs.existsSync(UPSTREAM)) {
    process.stderr.write(`[curate] upstream not found: ${UPSTREAM}\n`);
    process.exit(1);
  }
  log('upstream', UPSTREAM);
  log('dest', DEST);
  copyAgents();
  copySkills();
  copyCommands();
  copyRules();
  copyScripts();
  copyInstallers();
  copyTests();
  log('done', 'ok');
}

main();
