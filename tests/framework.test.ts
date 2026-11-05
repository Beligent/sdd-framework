import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, symlink, link, cp, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { createHash } from 'node:crypto';
import { configDefaults, parseConfig, validateConfig, type ProjectConfig } from '../src/validation/config.js';
import { localLinkErrors, parseFrontmatter, validateProjectRecords, validateRepository } from '../src/validation/repository.js';
import { mappings, skills, syncAssets } from '../src/packaging/sync-assets.js';
import { prepareHostPackage, preflightHostPackage, hostRoots } from '../src/packaging/hosts.js';
import { createUsageRecord, formatUsageFooter, parseAgentUsage, summarizeUsage } from '../src/usage/usage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary: string[] = [];

async function tempdir(): Promise<string> {
  const result = await mkdtemp(path.join(os.tmpdir(), 'beligent-ts-test-'));
  temporary.push(result);
  return result;
}
afterEach(async () => { await Promise.all(temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

async function templateConfig(): Promise<ProjectConfig> {
  const text = await readFile(path.join(root, 'skills/sdd-init/assets/config.json'), 'utf8');
  const config = JSON.parse(text) as ProjectConfig;
  config.project = { name: 'Fixture project', type: 'existing application' };
  return config;
}

async function writeArtifact(file: string, metadata: Record<string, unknown>, body: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `---\n${stringify(metadata)}---\n${body}`, 'utf8');
}

describe('consumer configuration validation', () => {

  it('requires rendered project values in consumer config while allowing the bundled template in repository checks', async () => {
    const template = JSON.parse(await readFile(path.join(root, 'skills/sdd-init/assets/config.json'), 'utf8')) as ProjectConfig;
    expect(validateConfig(template).some((issue) => issue.message.includes('unrendered'))).toBe(true);
    expect(validateConfig(template, undefined, true)).toEqual([]);
    template.artifacts.requirements = '../escape';
    expect(validateConfig(template, undefined, true).length).toBeGreaterThan(0);
  });

  it('reports missing required fields, unsupported providers, and invalid values', async () => {
    const config = await templateConfig();
    expect(validateConfig({ ...config, project: { name: 'ok' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, tickets: { ...config.tickets, provider: 'github' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, assistants: ['Bad assistant name'] }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, assistants: ['cursor', 'my-agent'] })).toEqual([]);
    expect(validateConfig({ ...config, profile: 'unconfigured' }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, technologies: ['unknown-stack'] }).length).toBeGreaterThan(0);
  });

  it.each(['light', 'standard', 'rigorous'] as const)('accepts rigor %s independently of design depth', async (rigor) => {
    const config = await templateConfig();
    config.workflow.rigor = rigor;
    expect(validateConfig(config)).toEqual([]);
  });

  it.each(['current-task', 'near-term', 'comprehensive'] as const)('accepts design depth %s independently of rigor', async (designDepth) => {
    const config = await templateConfig();
    config.workflow.design_depth = designDepth;
    expect(validateConfig(config)).toEqual([]);
  });

  it('rejects invalid policy values and unknown configuration keys', async () => {
    const config = await templateConfig();
    expect(validateConfig({ ...config, workflow: { ...config.workflow, rigor: 'casual' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, workflow: { ...config.workflow, design_depth: 'forever' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, workflow: { ...config.workflow, extra: true } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, testing: { ...config.testing, unit: 'sometimes' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, git: { ...config.git, push_after_commit: 'maybe' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, git: { ...config.git, extra: true } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, unexpected: true }).length).toBeGreaterThan(0);
  });

  it('uses the recommended workflow, testing, and delivery defaults', async () => {
    const config = await templateConfig();
    expect({ tracking: config.tracking, workflow: config.workflow, testing: config.testing, git: config.git }).toEqual(configDefaults);
    expect(config.workflow).toEqual({ rigor: 'standard', design_depth: 'current-task', ask_before_expansion: true });
    expect(config.testing).toMatchObject({ lint: 'always', typecheck: 'always', unit: 'when-relevant', e2e: 'critical-user-journeys', accessibility: 'affected-ui', security: 'risk-based' });
    expect(config.git).toMatchObject({ strategy: 'feature-branches', conventional_commits: true, push_after_commit: 'ask', pull_request: 'feature-complete', delivery_complete_at: 'merged-pr' });
    expect(validateConfig(config)).toEqual([]);
  });

  it('rejects duplicate keys at any JSON depth and invalid JSON constants', () => {
    expect(() => parseConfig('{"a":1,"a":2}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"a":{"b":1,"b":2}}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"x":NaN}')).toThrow();
  });

  it.each(['../outside', '/absolute', 'C:/outside', 'docs\\outside', './docs', 'docs//work', 'AGENTS.md', '.sdd/beligent/config.json', '.agents/skills/x', '{{path}}'])('rejects unsafe or reserved path %s', async (value) => {
    const config = await templateConfig();
    config.artifacts.requirements = value;
    expect(validateConfig(config).length).toBeGreaterThan(0);
  });

  it('rejects output collisions and overview paths inside ticket storage', async () => {
    const config = await templateConfig();
    config.tickets.paths.tickets = config.tickets.paths.epics;
    expect(validateConfig(config).some((issue) => issue.message.includes('overlap'))).toBe(true);
    const other = await templateConfig();
    other.artifacts.overview = '.sdd/beligent/tickets/overview.md';
    expect(validateConfig(other).some((issue) => issue.message.includes('authoritative'))).toBe(true);

    const nested = await templateConfig();
    nested.tickets.paths.epics = 'work';
    nested.tickets.paths.tickets = 'work/tickets';
    expect(validateConfig(nested).some((issue) => issue.message.includes('overlap'))).toBe(true);
  });

  it('accepts adopted project paths without changing files and rejects symlink/hardlink destinations', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    config.artifacts.overview = 'handbook/context.md';
    config.artifacts.requirements = 'planning/reqs';
    await mkdir(path.join(project, 'handbook'), { recursive: true });
    await writeFile(path.join(project, 'handbook/context.md'), 'Keep this text');
    await mkdir(path.join(project, 'planning/reqs'), { recursive: true });
    const before = await readFile(path.join(project, 'handbook/context.md'), 'utf8');
    expect(validateConfig(config, project)).toEqual([]);
    expect(await readFile(path.join(project, 'handbook/context.md'), 'utf8')).toBe(before);
    const wrongType = path.join(project, config.tickets.paths.epics);
    await mkdir(path.dirname(wrongType), { recursive: true });
    await writeFile(wrongType, 'file where directory belongs');
    expect(validateConfig(config, project).some((issue) => issue.message.includes('expected a directory'))).toBe(true);
    await rm(wrongType);

    const outside = await tempdir();
    await mkdir(path.join(outside, 'linked'));
    await symlink(path.join(outside, 'linked'), path.join(project, 'escape'));
    config.artifacts.requirements = 'escape/new';
    expect(validateConfig(config, project).some((issue) => issue.message.includes('symlink'))).toBe(true);
    await writeFile(path.join(outside, 'linked-file.md'), 'preserve');
    await symlink(path.join(outside, 'linked-file.md'), path.join(project, 'linked-file.md'));
    config.artifacts.overview = 'linked-file.md';
    expect(validateConfig(config, project).some((issue) => issue.message.includes('symlink'))).toBe(true);

    const shared = path.join(outside, 'shared.md');
    await writeFile(shared, 'preserve');
    const hardlinked = path.join(project, 'hardlinked.md');
    await link(shared, hardlinked);
    config.artifacts.overview = 'hardlinked.md';
    expect(validateConfig(config, project).some((issue) => issue.message.includes('hard-linked'))).toBe(true);
  });

});

describe('canonical skill packaging', () => {
  it('copies exact bytes to every mapped consumer and writes source manifests', async () => {
    const project = await tempdir();
    const sources = [...new Set(mappings().map((entry) => entry.source))];
    for (const [index, source] of sources.entries()) {
      await mkdir(path.dirname(path.join(project, source)), { recursive: true });
      await writeFile(path.join(project, source), Buffer.from(`Canonical ${index}: ${source}\n\0\xff`));
    }
    expect(await syncAssets(project)).toEqual([]);
    for (const mapping of mappings()) {
      expect(await readFile(path.join(project, mapping.destination))).toEqual(await readFile(path.join(project, mapping.source)));
      const [, skill, ...localParts] = mapping.destination.split('/');
      const manifest = JSON.parse(await readFile(path.join(project, 'skills', skill!, 'PACKAGED.json'), 'utf8')) as { resources: Record<string, string> };
      expect(manifest.resources[localParts.join('/')]).toBe(mapping.source);
    }
  });

  it('check mode is read-only and detects missing, changed, and unrecorded generated resources', async () => {
    const project = await tempdir();
    const sources = [...new Set(mappings().map((entry) => entry.source))];
    for (const source of sources) {
      await mkdir(path.dirname(path.join(project, source)), { recursive: true });
      await writeFile(path.join(project, source), source);
    }
    expect(await syncAssets(project)).toEqual([]);
    const source = mappings()[0]!;
    await writeFile(path.join(project, source.destination), 'changed');
    const [, skill] = source.destination.split('/');
    await writeFile(path.join(project, 'skills', skill!, 'PACKAGED.json'), '{"generated":false,"resources":{}}\n');
    const before = (await stat(path.join(project, source.destination))).mtimeMs;
    const errors = await syncAssets(project, true);
    expect(errors.some((error) => error.includes(source.destination))).toBe(true);
    expect(errors.some((error) => error.includes('PACKAGED.json'))).toBe(true);
    expect((await stat(path.join(project, source.destination))).mtimeMs).toBe(before);
    await rm(path.join(project, source.destination));
    expect((await syncAssets(project, true)).some((error) => error.includes(source.destination))).toBe(true);
  });

  it('reports missing canonical sources without creating outputs', async () => {
    const project = await tempdir();
    const source = mappings()[0]!;
    await mkdir(path.dirname(path.join(project, source.destination)), { recursive: true });
    await writeFile(path.join(project, source.destination), 'untouched');
    const before = await readFile(path.join(project, source.destination), 'utf8');
    expect((await syncAssets(project, true)).some((error) => error.includes('Missing canonical source'))).toBe(true);
    expect(await readFile(path.join(project, source.destination), 'utf8')).toBe(before);
  });

  it('reports missing copied outputs on check without writing them', async () => {
    const project = await tempdir();
    for (const source of new Set(mappings().map((entry) => entry.source))) {
      await mkdir(path.dirname(path.join(project, source)), { recursive: true });
      await writeFile(path.join(project, source), source);
    }
    expect((await syncAssets(project, true)).length).toBeGreaterThan(0);
    expect(await fileExists(path.join(project, mappings()[0]!.destination))).toBe(false);
  });

  it('repeated synchronization does not rewrite identical destinations', async () => {
    const project = await tempdir();
    for (const source of new Set(mappings().map((entry) => entry.source))) {
      await mkdir(path.dirname(path.join(project, source)), { recursive: true });
      await writeFile(path.join(project, source), source);
    }
    expect(await syncAssets(project)).toEqual([]);
    const dest = path.join(project, mappings()[0]!.destination);
    const before = (await stat(dest, { bigint: true })).mtimeNs;
    expect(await syncAssets(project)).toEqual([]);
    expect((await stat(dest, { bigint: true })).mtimeNs).toBe(before);
  });
});

describe('repository and artifact validation', () => {
  it('validates the checked-in five-skill repository and worked example', async () => {
    expect(await validateRepository(root)).toEqual([]);
  });

  it('rejects duplicate YAML keys and links outside a skill package', async () => {
    expect(() => parseFrontmatter('---\na: 1\na: 2\n---\nbody')).toThrow();
    const dir = await tempdir();
    await writeFile(path.join(dir, 'page.md'), '[escape](../outside.md)');
    expect((await localLinkErrors(path.join(dir, 'page.md'), dir)).some((error) => error.includes('escapes'))).toBe(true);
    await mkdir(path.join(dir, 'references'));
    await writeFile(path.join(dir, 'references/guide.md'), '# Guide\n');
    await writeFile(path.join(dir, 'page.md'), '[guide](references/guide.md)');
    expect(await localLinkErrors(path.join(dir, 'page.md'), dir)).toEqual([]);
    await writeFile(path.join(dir, 'page.md'), '[missing](references/nope.md)');
    expect((await localLinkErrors(path.join(dir, 'page.md'), dir)).some((error) => error.includes('missing local link'))).toBe(true);
    await writeFile(path.join(dir, 'references/guide.md'), '# Guide\n\n## Section\n');
    await writeFile(path.join(dir, 'page.md'), '[bad anchor](references/guide.md#nope)');
    expect((await localLinkErrors(path.join(dir, 'page.md'), dir)).some((error) => error.includes('missing local anchor'))).toBe(true);
  });

  it('validates the copied Copilot fragment from its eventual project destination', async () => {
    const project = await tempdir();
    await writeFile(path.join(project, 'AGENTS.md'), '# Existing instructions\n');
    const config = await templateConfig();
    await mkdir(path.join(project, '.sdd', 'beligent'), { recursive: true });
    await writeFile(path.join(project, '.sdd/beligent/config.json'), JSON.stringify(config));
    await mkdir(path.join(project, '.github'), { recursive: true });
    await cp(path.join(root, 'skills/sdd-init/assets/copilot.fragment.md'), path.join(project, '.github/copilot-instructions.md'));
    expect(await localLinkErrors(path.join(project, '.github/copilot-instructions.md'), project)).toEqual([]);
  });

  it('checks installed skill copies after their source checkout is unavailable', async () => {
    const copied = path.join(await tempdir(), 'skills');
    await cp(path.join(root, 'skills'), copied, { recursive: true });
    for (const skill of skills) {
      const boundary = path.join(copied, skill);
      const documents = await markdownFilesForTest(boundary);
      for (const document of documents) {
        if (path.relative(boundary, document).split(path.sep).includes('assets')) continue;
        expect(await localLinkErrors(document, boundary), `${skill}/${path.relative(boundary, document)}`).toEqual([]);
      }
    }
  });

});

describe('skill usage accounting', () => {
  it('normalizes Codex totals and aggregates records without source content', () => {
    const source = '{"type":"turn.completed","usage":{"input_tokens":100,"input_tokens_details":{"cached_tokens":40},"output_tokens":25,"output_tokens_details":{"reasoning_tokens":5},"total_tokens":125},"secret":"do not retain"}\n';
    expect(parseAgentUsage('codex', source)).toMatchObject({ input_tokens: 100, cached_input_tokens: 40, output_tokens: 25, reasoning_tokens: 5, total_tokens: 125 });
    const item = createUsageRecord('codex', 'sdd-define', 'TICKET-1', source, '2026-10-22T00:00:00.000Z');
    expect(JSON.stringify(item)).not.toContain('do not retain');
    expect(formatUsageFooter(item)).toBe('Token usage — sdd-define (codex): 125 total | 100 input | 40 cached input | 0 cache write | 25 output | 5 reasoning');
    expect(summarizeUsage([item, { ...item, id: 'another' }])).toMatchObject([{ skill: 'sdd-define', runs: 2, total_tokens: 250 }]);
  });

  it('sums Claude streaming message usage when the result has cost but no aggregate usage', () => {
    const source = '{"type":"assistant","message":{"usage":{"input_tokens":30,"cache_read_input_tokens":10,"cache_creation_input_tokens":4,"output_tokens":8}}}\n{"type":"assistant","message":{"usage":{"input_tokens":20,"output_tokens":7}}}\n{"type":"result","total_cost_usd":0.012}\n';
    expect(parseAgentUsage('claude', source)).toEqual({
      input_tokens: 50, cached_input_tokens: 10, cache_creation_input_tokens: 4,
      output_tokens: 15, reasoning_tokens: 0, total_tokens: 79, cost_usd: 0.012,
    });
  });
});

describe('CLI', () => {
  function run(args: string[]) {
    return spawnSync(process.execPath, ['--import', 'tsx', path.join(root, 'src/cli/index.ts'), ...args], { cwd: root, encoding: 'utf8' });
  }

  it('prints version and returns expected usage/unknown-command exit codes', () => {
    const version = run(['version']);
    expect(version.status).toBe(0);
    expect(version.stdout.trim()).toBe('1.0.0');
    expect(run(['unknown']).status).toBe(2);
    expect(run(['migrate-config']).status).toBe(2);
    expect(run(['validate', '--unknown']).status).toBe(2);
  });

  it('keeps the authoritative package version and lockfile in sync', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { version: string };
    const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8')) as { version: string; packages: Record<string, { version: string }> };
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages['']?.version).toBe(pkg.version);
  });

  it('reports either lockfile version mismatch without changing release metadata', async () => {
    const project = await tempdir();
    const script = path.join(project, 'src/validation/version-cli.ts');
    await mkdir(path.dirname(script), { recursive: true });
    await cp(path.join(root, 'src/validation/version-cli.ts'), script);
    await writeFile(path.join(project, 'package.json'), JSON.stringify({ version: '1.0.0', type: 'module' }));
    const lockPath = path.join(project, 'package-lock.json');
    for (const lock of [
      { version: '0.2.1', packages: { '': { version: '1.0.0' } } },
      { version: '1.0.0', packages: { '': { version: '0.2.1' } } },
    ]) {
      const before = JSON.stringify(lock);
      await writeFile(lockPath, before);
      const result = spawnSync(process.execPath, ['--import', 'tsx', script], { cwd: root, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Version mismatch');
      expect(await readFile(lockPath, 'utf8')).toBe(before);
    }
  });

  it('imports Codex and Claude token usage and reports totals by skill without retaining prompts', async () => {
    const project = await tempdir();
    const codex = path.join(project, 'codex.jsonl');
    const claude = path.join(project, 'claude.jsonl');
    const store = path.join(project, '.sdd/beligent/usage.jsonl');
    await writeFile(codex, '{"type":"item.completed","text":"private prompt"}\n{"type":"turn.completed","usage":{"input_tokens":100,"input_tokens_details":{"cached_tokens":40},"output_tokens":25,"output_tokens_details":{"reasoning_tokens":5},"total_tokens":125}}\n');
    await writeFile(claude, '{"type":"assistant","message":{"usage":{"input_tokens":30,"cache_read_input_tokens":10,"cache_creation_input_tokens":4,"output_tokens":8}}}\n{"type":"assistant","message":{"usage":{"input_tokens":20,"output_tokens":7}}}\n{"type":"result","total_cost_usd":0.012}\n');

    const footer = run(['usage', 'footer', '--agent', 'codex', '--skill', 'sdd-define', '--file', codex]);
    expect(footer.status).toBe(0);
    expect(footer.stdout.trim()).toBe('Token usage — sdd-define (codex): 125 total | 100 input | 40 cached input | 0 cache write | 25 output | 5 reasoning');
    expect(run(['usage', 'import', '--agent', 'codex', '--skill', 'sdd-define', '--file', codex, '--task', 'TICKET-1', '--store', store]).status).toBe(0);
    expect(run(['usage', 'import', '--agent', 'claude', '--skill', 'sdd-implement', '--file', claude, '--store', store]).status).toBe(0);
    expect(run(['usage', 'import', '--agent', 'codex', '--skill', 'sdd-define', '--file', codex, '--task', 'TICKET-1', '--store', store]).stdout).toContain('already imported');
    const report = run(['usage', 'report', '--store', store, '--json']);
    expect(report.status).toBe(0);
    const summary = JSON.parse(report.stdout) as Array<{ skill: string; total_tokens: number; cost_usd: number }>;
    expect(summary.find((item) => item.skill === 'sdd-define')?.total_tokens).toBe(125);
    expect(summary.find((item) => item.skill === 'sdd-implement')).toMatchObject({ total_tokens: 79, cost_usd: 0.012 });
    expect(await readFile(store, 'utf8')).not.toContain('private prompt');
  });

  it('validates a project config and returns a nonzero exit status for bad config', async () => {
    const project = await tempdir();
    await mkdir(path.join(project, '.sdd', 'beligent'), { recursive: true });
    const config = await templateConfig();
    await writeFile(path.join(project, '.sdd/beligent/config.json'), JSON.stringify(config));
    expect(run(['validate', '--config', path.join(project, '.sdd/beligent/config.json')]).status).toBe(0);
    await writeFile(path.join(project, '.sdd/beligent/config.json'), JSON.stringify({ ...config, schema_version: 3 }));
    expect(run(['validate', '--config', path.join(project, '.sdd/beligent/config.json')]).status).toBe(1);
  });

  it('doctor reports missing config and warns about absent skills without modifying the target', async () => {
    const project = await tempdir();
    const result = run(['doctor', project]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('config.json is missing');
    expect(result.stderr).toContain('WARN skills not found');
    expect(await readdirSafe(project)).toEqual([]);
  });

  it('doctor reports a valid config and discovers installed project skills', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    await mkdir(path.join(project, '.sdd', 'beligent'), { recursive: true });
    await writeFile(path.join(project, '.sdd/beligent/config.json'), JSON.stringify(config));
    await mkdir(path.join(project, '.agents/skills/sdd-init'), { recursive: true });
    await writeFile(path.join(project, '.agents/skills/sdd-init/SKILL.md'), '---\nname: sdd-init\ndescription: setup\n---\n');
    const result = run(['doctor', project]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK configuration, rigor standard, design depth current-task, tracking opt-in');
    expect(result.stdout).toContain('sdd-init');
    expect(result.stderr).toContain('WARN skills not found');
    expect(result.stderr).toContain('sdd-implement');
    expect(result.stderr).toContain('sdd-audit');
    expect(result.stderr).toContain('sdd-deliver');
  });
});

async function readdirSafe(directory: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  return readdir(directory);
}

async function fileExists(file: string): Promise<boolean> {
  try { await stat(file); return true; } catch { return false; }
}

async function markdownFilesForTest(directory: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFilesForTest(filename);
    return entry.isFile() && filename.endsWith('.md') ? [filename] : [];
  }));
  return contents.flat();
}

describe('default configuration and tracked completion', () => {
  it('supports only the unversioned default and leaves legacy inputs unchanged', async () => {
    const config = await templateConfig();
    expect(validateConfig(config)).toEqual([]);
    expect(config.tracking.mode).toBe('opt-in');
    for (const schema_version of [1, 2, 3, true, null, '1']) {
      const legacy = { ...config, schema_version };
      const snapshot = structuredClone(legacy);
      expect(validateConfig(legacy)[0]?.message).toContain('reviewed conversion');
      expect(legacy).toEqual(snapshot);
    }
    expect(validateConfig({ ...config, tracking: { mode: 'automatic' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, tracking: { mode: 'always' } })).toEqual([]);
  });

  it('validates untracked configuration without creating artifact directories', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    expect(validateConfig(config, project)).toEqual([]);
    expect(await validateProjectRecords(project, config)).toEqual([]);
    expect(await readdirSafe(project)).toEqual([]);
  });

});

const taskBody = '# Change\n\n## Objective\n\nFix one behavior.\n\n## Behavior\n\nProduce the correct result.\n\n## Acceptance criteria\n\n### AC-001\n\nThe regression check passes.\n';
function passingTicket(): Record<string, unknown> {
  return { id: 'TICKET-001', revision: 1, status: 'done', implementation: 'sha256:fixture', checks: [{ id: 'regression', criteria: ['TICKET-001/AC-001'], required: true, command: 'node --test', outcome: 'pass', revision: 1, snapshot: 'sha256:fixture' }] };
}
async function ticketCase(metadata: Record<string, unknown>, body = taskBody): Promise<string[]> {
  const project = await tempdir();
  const config = await templateConfig();
  await writeArtifact(path.join(project, config.tickets.paths.tickets, 'TICKET-001.md'), metadata, body);
  return validateProjectRecords(project, config);
}

describe('runbook record lifecycle', () => {
  it('closes a standalone ticket without human acceptance, an epic, shared spec or delivery', async () => {
    expect(await ticketCase(passingTicket())).toEqual([]);
  });
  it('keeps delivery state separate while validating its declared evidence', async () => {
    const record = passingTicket();
    record.delivery = { state: 'blocked', reason: 'Push permission pending' };
    expect(await ticketCase(record)).toEqual([]);
    record.delivery = { state: 'committed' };
    expect((await ticketCase(record)).join(' ')).toContain('observed reference');
    record.delivery = { state: 'delivered', reference: 'fixture-commit', point: 'commit' };
    expect((await ticketCase(record)).join(' ')).toContain('delivery milestone');
  });
  it('allows preliminary or blocked questions but never closes unresolved original scope', async () => {
    const body = taskBody + '\n## Blocking questions\nWhich provider is required?\n';
    expect(await ticketCase({ id: 'TICKET-001', revision: 1, status: 'blocked' }, body)).toEqual([]);
    expect((await ticketCase(passingTicket(), body)).join(' ')).toContain('unresolved blocking questions');
  });
  it.each(['fail', 'blocked', 'unverified', 'not-applicable'])('keeps a ticket open for required %s checks', async (outcome) => {
    const record = passingTicket();
    (record.checks as Record<string, unknown>[])[0]!.outcome = outcome;
    expect((await ticketCase(record)).join(' ')).toContain('keep open');
    record.status = 'blocked';
    if (outcome === 'not-applicable') (record.checks as Record<string, unknown>[])[0]!.reason = 'Fixture';
    expect(await ticketCase(record)).toEqual([]);
  });
  it('rejects narrative failure evidence and missing structured results at closure', async () => {
    expect((await ticketCase({ id: 'TICKET-001', revision: 1, status: 'done', implementation: 'fixture' }, taskBody + '\n## Evidence\nRequired check: FAIL.\n')).join(' ')).toContain('structured required checks');
  });
  it.each(['revision', 'snapshot'])('rejects stale check %s', async (field) => {
    const record = passingTicket();
    (record.checks as Record<string, unknown>[])[0]![field] = field === 'revision' ? 2 : 'old-snapshot';
    expect((await ticketCase(record)).join(' ')).toContain('stale');
  });
  it('requires a reviewed implementation snapshot and evidence for every criterion', async () => {
    const record = passingTicket();
    delete record.implementation;
    expect((await ticketCase(record)).join(' ')).toContain('implementation snapshot');
    expect((await ticketCase(passingTicket(), taskBody + '\n### AC-002\nAnother original behavior.\n')).join(' ')).toContain('TICKET-001/AC-002');
  });
  it('accepts recorded manual checks and rejects a procedure-free result', async () => {
    const record = passingTicket();
    const check = (record.checks as Record<string, unknown>[])[0]!;
    delete check.command; check.procedure = 'Observe the affected route using fixture account.';
    expect(await ticketCase(record)).toEqual([]);
    delete check.procedure;
    expect((await ticketCase(record)).join(' ')).toContain('invalid criterion check');
  });
  it('preserves prior evidence while an authorized reopen makes it stale', async () => {
    const record = passingTicket();
    const oldChecks = structuredClone(record.checks);
    record.revision = 2; record.status = 'todo';
    record.history = [{ revision: 1, reason: 'Audit found original AC-001 unmet; explicit reopen authorized', checks: oldChecks, snapshot: record.implementation }];
    expect(await ticketCase(record)).toEqual([]);
    record.status = 'done';
    expect((await ticketCase(record)).join(' ')).toContain('stale');
    (record.checks as Record<string, unknown>[])[0]!.revision = 2;
    expect(await ticketCase(record)).toEqual([]);
    expect((record.history as Record<string, unknown>[])[0]!.checks).toEqual(oldChecks);
  });
  it('validates shared spec references, optional epic membership, dependencies and duplicate IDs', async () => {
    const project = await tempdir(); const config = await templateConfig();
    const spec = path.join(project, config.artifacts.specifications!, 'SPEC-001.md');
    await writeArtifact(spec, { id: 'SPEC-001', revision: 1, status: 'ready' }, '# Shared behavior\n\n## AC-001\nCorrect result.\n');
    const record = passingTicket(); record.specifications = ['SPEC-001']; record.acceptance_criteria = ['SPEC-001/AC-001']; record.epic = 'EPIC-001';
    (record.checks as Record<string, unknown>[])[0]!.criteria = ['SPEC-001/AC-001'];
    const ticket = path.join(project, config.tickets.paths.tickets, 'TICKET-001.md');
    await writeArtifact(ticket, record, '# Task reuses shared behavior.\n');
    const epic = { id: 'EPIC-001', revision: 1, status: 'todo', tickets: ['TICKET-001'] };
    await writeArtifact(path.join(project, config.tickets.paths.epics, 'EPIC-001.md'), epic, '# Outcome\n\n## AC-001\nChild completes.\n');
    expect(await validateProjectRecords(project, config)).toEqual([]);
    record.acceptance_criteria = ['SPEC-001/AC-999'];
    await writeArtifact(ticket, record, '# Broken reference\n');
    expect((await validateProjectRecords(project, config)).join(' ')).toContain('unresolved acceptance criterion');
    record.acceptance_criteria = ['SPEC-001/AC-001']; record.dependencies = ['TICKET-001'];
    await writeArtifact(ticket, record, '# Self-dependency\n');
    expect((await validateProjectRecords(project, config)).join(' ')).toContain('Dependency cycle');
    await cp(ticket, path.join(path.dirname(ticket), 'duplicate.md'));
    expect((await validateProjectRecords(project, config)).join(' ')).toContain('Duplicate artifact ID');
  });
  it('rejects malformed IDs, boolean revisions, duplicate criteria and check IDs', async () => {
    expect((await ticketCase({ ...passingTicket(), id: 'TICKET-0' })).join(' ')).toContain('invalid stable artifact ID');
    expect((await ticketCase({ ...passingTicket(), revision: true })).join(' ')).toContain('positive integer');
    expect((await ticketCase(passingTicket(), taskBody + '\n### AC-001\nDuplicate.\n')).join(' ')).toContain('duplicate criterion IDs');
    const record = passingTicket(); (record.checks as unknown[]).push(structuredClone((record.checks as unknown[])[0]));
    expect((await ticketCase(record)).join(' ')).toContain('duplicate check IDs');
  });
});

describe('selected host package plans', () => {
  it.each(Object.keys(hostRoots) as (keyof typeof hostRoots)[])('copies only selected %s integration and shared guidance, twice without rewriting', async (host) => {
    const project = await tempdir();
    const files = await prepareHostPackage(root, [host], ['python']);
    await writeFile(path.join(project, 'AGENTS.md'), 'Handwritten instructions\n');
    await writeFile(path.join(project, 'app.txt'), 'User application\n');
    expect(await preflightHostPackage(project, files)).toEqual([]);
    for (const file of files) { await mkdir(path.dirname(path.join(project, file.path)), { recursive: true }); await writeFile(path.join(project, file.path), file.bytes); }
    const sample = path.join(project, hostRoots[host], 'sdd-implement/SKILL.md');
    const timestamp = (await stat(sample, { bigint: true })).mtimeNs;
    const repeated = await prepareHostPackage(root, [host], ['python']);
    expect(await preflightHostPackage(project, repeated)).toEqual([]);
    for (const file of repeated) {
      const existing = await readFile(path.join(project, file.path));
      if (!existing.equals(file.bytes)) await writeFile(path.join(project, file.path), file.bytes);
    }
    expect((await stat(sample, { bigint: true })).mtimeNs).toBe(timestamp);
    expect(await readFile(path.join(project, 'AGENTS.md'), 'utf8')).toBe('Handwritten instructions\n');
    expect(await readFile(path.join(project, 'app.txt'), 'utf8')).toBe('User application\n');
    for (const skill of skills) expect(await readFile(path.join(project, hostRoots[host], skill, 'SKILL.md'))).toEqual(await readFile(path.join(root, 'skills', skill, 'SKILL.md')));
    expect(await fileExists(path.join(project, '.sdd/beligent/tickets'))).toBe(false);
    expect(await fileExists(path.join(project, '.sdd/beligent/guidance/python.md'))).toBe(true);
    expect(await fileExists(path.join(project, '.sdd/beligent/guidance/nextjs.md'))).toBe(false);
    expect(files.filter((file) => /skills\/[^/]+\/SKILL.md$/.test(file.path))).toHaveLength(5);
    for (const file of files.filter((file) => file.path.startsWith('.sdd/beligent/guidance/') && file.path.endsWith('.md'))) expect(await localLinkErrors(path.join(project, file.path), project)).toEqual([]);
  });
  it('deduplicates a shared Codex/Copilot root and refuses unreviewed content or unsafe paths', async () => {
    const project = await tempdir();
    const files = await prepareHostPackage(root, ['codex', 'github-copilot']);
    expect(files.filter((file) => file.path.endsWith('/SKILL.md'))).toHaveLength(5);
    const guide = files.find((file) => file.path.endsWith('guidance/engineering.md'))!;
    await mkdir(path.dirname(path.join(project, guide.path)), { recursive: true });
    await writeFile(path.join(project, guide.path), 'Local edited guidance');
    expect((await preflightHostPackage(project, files)).join(' ')).toContain('reviewed merge');
    expect(await readFile(path.join(project, guide.path), 'utf8')).toBe('Local edited guidance');
    expect((await preflightHostPackage(project, [{ path: '../escape', bytes: Buffer.from('x') }])).join(' ')).toContain('Unsafe');
    const other = await tempdir(); await symlink(other, path.join(project, 'linked'));
    expect((await preflightHostPackage(project, [{ path: 'linked/guide.md', bytes: Buffer.from('x') }])).join(' ')).toContain('Unsafe');
  });
});

describe('runbook fixtures and diagnostics', () => {
  it('runs direct/tracked/blocked/post-close scenarios and validates the fixture graph', async () => {
    const example = path.join(root, 'examples/workflow-fixture');
    const config = JSON.parse(await readFile(path.join(example, '.sdd/beligent/config.json'), 'utf8')) as ProjectConfig;
    expect(await validateProjectRecords(example, config)).toEqual([]);
    for (const [ticket, module] of [['TICKET-001', 'app.mjs'], ['TICKET-004', 'before.mjs'], ['TICKET-005', 'audit-regression.mjs']]) {
      const record = parseFrontmatter(await readFile(path.join(example, config.tickets.paths.tickets, ticket! + '.md'), 'utf8')).data;
      const bytes = await Promise.all([module!, 'regression.test.mjs', 'app.mjs'].map((file) => readFile(path.join(example, file))));
      expect(record.implementation).toBe('sha256:' + createHash('sha256').update(Buffer.concat(bytes)).digest('hex'));
    }
    const run = spawnSync(process.execPath, ['run-scenarios.mjs'], { cwd: example, encoding: 'utf8' });
    expect(run.status, run.stdout + run.stderr).toBe(0);
    expect(run.stdout).toContain('direct fix and tracked implementation: PASS');
    expect(run.stdout).toContain('post-close audit detects missed original criterion: expected FAIL');
    const project = await tempdir();
    await cp(example, project, { recursive: true });
    await cp(path.join(example, 'cases/invalid-done.md'), path.join(project, config.tickets.paths.tickets, 'TICKET-999.md'));
    expect((await validateProjectRecords(project, config)).join(' ')).toContain('keep open');
    const childFile = path.join(project, config.tickets.paths.tickets, 'TICKET-003.md');
    const child = parseFrontmatter(await readFile(childFile, 'utf8'));
    await writeArtifact(childFile, { ...child.data, status: 'blocked' }, child.body);
    expect((await validateProjectRecords(project, config)).join(' ')).toContain('completed child tickets');
  });
  it('detects duplicate discovery and legacy setup without changing project files', async () => {
    const project = await tempdir();
    await mkdir(path.join(project, '.beligent'), { recursive: true });
    const legacy = path.join(project, '.beligent/config.json');
    await writeFile(legacy, '{"schema_version":1}');
    for (const destination of ['.agents/skills/sdd-implement', '.claude/skills/sdd-implement']) {
      await mkdir(path.join(project, destination), { recursive: true });
      await cp(path.join(root, 'skills/sdd-implement/SKILL.md'), path.join(project, destination, 'SKILL.md'));
    }
    const run = spawnSync(process.execPath, ['--import', 'tsx', path.join(root, 'src/cli/index.ts'), 'doctor', project], { cwd: root, encoding: 'utf8' });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('legacy .beligent installation detected');
    expect(run.stderr).toContain('duplicate discovery risk');
    expect(await readFile(legacy, 'utf8')).toBe('{"schema_version":1}');
    expect(await fileExists(path.join(project, '.sdd/beligent/config.json'))).toBe(false);
  });
  it('resolves safety and records from consumer root with the nested default config', async () => {
    const project = await tempdir(); const config = await templateConfig();
    const configFile = path.join(project, '.sdd/beligent/config.json');
    await mkdir(path.dirname(configFile), { recursive: true });
    await writeFile(configFile, JSON.stringify(config));
    const record = passingTicket(); (record.checks as Record<string, unknown>[])[0]!.outcome = 'fail';
    await writeArtifact(path.join(project, config.tickets.paths.tickets, 'TICKET-001.md'), record, taskBody);
    const args = ['--import', 'tsx', path.join(root, 'src/cli/index.ts'), 'validate', '--config', configFile];
    const rejected = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain('keep open');
    const other = await tempdir(); await symlink(other, path.join(project, 'unsafe'));
    config.artifacts.specifications = 'unsafe/specs';
    await writeFile(configFile, JSON.stringify(config));
    const unsafe = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
    expect(unsafe.status).toBe(1); expect(unsafe.stderr).toContain('symlink');
  });
});
