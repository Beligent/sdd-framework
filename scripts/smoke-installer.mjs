import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const source = process.cwd();
const cli = process.argv[2];
if (!cli) throw new Error('Usage: node scripts/smoke-installer.mjs /path/to/skills-1.7.2/bin/cli.mjs');
const pkg = JSON.parse(await readFile(path.resolve(path.dirname(cli), '../package.json'), 'utf8'));
assert.equal(pkg.version, '1.7.2', 'Use the documented pinned external installer');
const skills = ['sdd-init', 'sdd-define', 'sdd-implement', 'sdd-audit', 'sdd-deliver'];
const roots = ['.agents/skills', '.claude/skills', '.cursor/skills', '.github/skills'];
async function files(root, relative = '') {
  const all = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) all.push(...await files(root, file));
    else if (entry.isFile()) all.push(file);
  }
  return all.sort();
}
const temporary = await mkdtemp(path.join(tmpdir(), 'beligent-installer-smoke-'));
try {
  for (const agents of [['codex'], ['claude-code'], ['github-copilot'], ['cursor'], ['codex', 'claude-code', 'github-copilot']]) {
    const project = path.join(temporary, agents.join('-'));
    const protectedFiles = ['AGENTS.md', 'CLAUDE.md', 'app.mjs', '.sdd/beligent/config.json', '.sdd/beligent/setup-state.json', '.sdd/beligent/tickets/TICKET-999.md'];
    const before = new Map();
    for (const file of protectedFiles) {
      const full = path.join(project, file);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, `Preserve handwritten fixture bytes: ${file}\n`);
      before.set(file, { bytes: await readFile(full), mtime: (await stat(full, { bigint: true })).mtimeNs });
    }
    for (let run = 0; run < 2; run++) {
      const result = spawnSync(process.execPath, [path.resolve(cli), 'add', source, '--skill', '*', '--agent', ...agents, '--copy', '-y'], {
        cwd: project, encoding: 'utf8', env: { ...process.env, CI: '1', DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' },
      });
      if (result.status !== 0) throw new Error(`Installer failed for ${agents}: ${result.stdout}\n${result.stderr}`);
      for (const [file, original] of before) {
        assert.deepEqual(await readFile(path.join(project, file)), original.bytes, `Preserve ${file}`);
        assert.equal((await stat(path.join(project, file), { bigint: true })).mtimeNs, original.mtime, `No rewrite ${file}`);
      }
    }
    let copies = 0; const observed = new Set();
    for (const root of roots) for (const skill of skills) {
      const installed = path.join(project, root, skill);
      try { await stat(installed); } catch { continue; }
      observed.add(root); copies++;
      const authored = path.join(source, 'skills', skill);
      assert.deepEqual(await files(installed), await files(authored), `Complete ${skill}`);
      for (const file of await files(authored)) assert.deepEqual(await readFile(path.join(installed, file)), await readFile(path.join(authored, file)), `Exact bytes ${skill}/${file}`);
    }
    assert.ok(copies >= skills.length, 'All five skills installed');
    console.log(`${agents.join('+')}: two copy installs passed; ${copies} complete skill copies; protected bytes/timestamps preserved; roots ${[...observed].join(', ')}`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
