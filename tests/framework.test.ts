import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, symlink, link, cp, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { parseConfig, validateConfig, type ProjectConfig } from '../src/validation/config.js';
import { localLinkErrors, parseFrontmatter, validateProjectRecords, validateRepository } from '../src/validation/repository.js';
import { mappings, syncAssets } from '../src/packaging/sync-assets.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary: string[] = [];

async function tempdir(): Promise<string> {
  const result = await mkdtemp(path.join(os.tmpdir(), 'beligent-ts-test-'));
  temporary.push(result);
  return result;
}
afterEach(async () => { await Promise.all(temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

async function templateConfig(): Promise<ProjectConfig> {
  const text = await readFile(path.join(root, 'skills/init-project/assets/config.json'), 'utf8');
  const config = JSON.parse(text) as ProjectConfig;
  config.project = { name: 'Fixture project', type: 'existing application' };
  return config;
}

async function writeArtifact(file: string, metadata: Record<string, unknown>, body: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `---\n${stringify(metadata)}---\n${body}`, 'utf8');
}

describe('consumer configuration validation', () => {
  it('accepts valid schema 1 config and the project template', async () => {
    const config = await templateConfig();
    expect(validateConfig(config)).toEqual([]);
    expect(validateConfig(JSON.parse(await readFile(path.join(root, 'skills/init-project/assets/config.json'), 'utf8')), undefined, true)).toEqual([]);
  });

  it('requires rendered project values in consumer config while allowing the bundled template in repository checks', async () => {
    const template = JSON.parse(await readFile(path.join(root, 'skills/init-project/assets/config.json'), 'utf8')) as ProjectConfig;
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

  it('calls unknown schema versions out separately and never migrates input', async () => {
    const config = await templateConfig();
    const before = structuredClone(config);
    const errors = validateConfig({ ...config, schema_version: 2 });
    expect(errors[0]?.message).toContain('separate migration');
    expect(config).toEqual(before);
    for (const schemaVersion of [true, false, 0, 2, null, '1']) {
      const issue = validateConfig({ ...config, schema_version: schemaVersion });
      expect(issue[0]?.message).toContain('separate migration');
    }
  });

  it('preserves custom profiles and requires implementation and completion gates', async () => {
    const config = await templateConfig();
    config.profiles.maintenance = { artifacts: ['ticket'], approvals: ['implementation', 'completion'] };
    config.profile = 'maintenance';
    expect(validateConfig(config)).toEqual([]);
    config.profiles.maintenance.approvals = ['scope'];
    expect(validateConfig(config).some((issue) => issue.message.includes('implementation and completion'))).toBe(true);
  });

  it('preserves schema 1 standard defaults and rejects vNext configuration fields', async () => {
    const config = await templateConfig();
    expect(config.schema_version).toBe(1);
    expect(config.profile).toBe('standard');
    expect(config.profiles.standard).toEqual({
      artifacts: ['overview', 'requirements', 'specification', 'plan', 'ticket'],
      approvals: ['scope', 'implementation', 'completion'],
    });
    expect(validateConfig({ ...config, workflow: { rigor: 'standard' } }).length).toBeGreaterThan(0);
  });

  it('rejects duplicate keys at any JSON depth and invalid JSON constants', () => {
    expect(() => parseConfig('{"a":1,"a":2}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"a":{"b":1,"b":2}}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"x":NaN}')).toThrow();
    expect(() => parseConfig('{"schema_version":1.0}')).toThrow('JSON integer 1');
  });

  it.each(['../outside', '/absolute', 'C:/outside', 'docs\\outside', './docs', 'docs//work', 'AGENTS.md', '.beligent/config.json', '.agents/skills/x', '{{path}}'])('rejects unsafe or reserved path %s', async (value) => {
    const config = await templateConfig();
    config.artifacts.requirements = value;
    expect(validateConfig(config).length).toBeGreaterThan(0);
  });

  it('rejects output collisions and overview paths inside ticket storage', async () => {
    const config = await templateConfig();
    config.tickets.paths.tickets = config.tickets.paths.epics;
    expect(validateConfig(config).some((issue) => issue.message.includes('overlap'))).toBe(true);
    const other = await templateConfig();
    other.artifacts.overview = 'docs/sdd/tickets/overview.md';
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
    const before = (await stat(dest)).mtimeNs;
    expect(await syncAssets(project)).toEqual([]);
    expect((await stat(dest)).mtimeNs).toBe(before);
  });
});

describe('repository and artifact validation', () => {
  it('validates the checked-in six-skill repository and worked example', async () => {
    expect(await validateRepository(root)).toEqual([]);
  });

  it('keeps incremental principles canonical and synchronizes their packaged copies', async () => {
    const source = 'skills/define-work/references/shared/governance.md';
    const governance = await readFile(path.join(root, source), 'utf8');
    const normalizedGovernance = governance.replace(/\s+/g, ' ');
    for (const principle of [
      'smallest amount of specification',
      'Specification stop rule',
      'Treat ordinary local and reversible implementation choices as local',
      'solely because a future version may need it',
      'future candidate rather than expanding the current implementation',
      'perform root-cause diagnosis',
    ]) expect(normalizedGovernance).toContain(principle);

    for (const mapping of mappings().filter((entry) => entry.source === source)) {
      expect(await readFile(path.join(root, mapping.destination), 'utf8')).toBe(governance);
    }
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
    await mkdir(path.join(project, '.beligent'), { recursive: true });
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify(config));
    await mkdir(path.join(project, '.github'), { recursive: true });
    await cp(path.join(root, 'skills/init-project/assets/copilot.fragment.md'), path.join(project, '.github/copilot-instructions.md'));
    expect(await localLinkErrors(path.join(project, '.github/copilot-instructions.md'), project)).toEqual([]);
  });

  it('checks installed skill copies after their source checkout is unavailable', async () => {
    const copied = path.join(await tempdir(), 'skills');
    await cp(path.join(root, 'skills'), copied, { recursive: true });
    for (const skill of ['init-project', 'adopt-project', 'define-work', 'plan-work', 'implement-ticket', 'verify-work']) {
      const boundary = path.join(copied, skill);
      const documents = await markdownFilesForTest(boundary);
      for (const document of documents) {
        if (path.relative(boundary, document).split(path.sep).includes('assets')) continue;
        expect(await localLinkErrors(document, boundary), `${skill}/${path.relative(boundary, document)}`).toEqual([]);
      }
    }
  });

  it('rejects ready work with missing links, invalid references, cycles, and false completion', async () => {
    const source = path.join(root, 'examples/team-task-tracker');
    const project = path.join(await tempdir(), 'example');
    await cp(source, project, { recursive: true });
    const config = JSON.parse(await readFile(path.join(project, '.beligent/config.json'), 'utf8')) as ProjectConfig;
    const ticketPath = path.join(project, 'docs/sdd/tickets/TICKET-001.md');
    const originalTicket = await readFile(ticketPath, 'utf8');
    let ticket = originalTicket.replace('dependencies: []', 'dependencies: [TICKET-MISSING]');
    await writeFile(ticketPath, ticket);
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('unresolved'))).toBe(true);
    ticket = originalTicket.replace('dependencies: []', 'dependencies: [TICKET-002]');
    const secondPath = path.join(project, 'docs/sdd/tickets/TICKET-002.md');
    const second = await readFile(secondPath, 'utf8');
    await writeFile(secondPath, second.replace('dependencies: []', 'dependencies: [TICKET-001]'));
    await writeFile(ticketPath, ticket);
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('Dependency cycle'))).toBe(true);
    await writeFile(secondPath, second);
    ticket = originalTicket.replace('status: todo', 'status: done');
    await writeFile(ticketPath, ticket);
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('done requires'))).toBe(true);
  });

  it('accepts a ready todo ticket without invented approval and rejects malformed refs and false done', async () => {
    const source = path.join(root, 'examples/team-task-tracker');
    const project = path.join(await tempdir(), 'example');
    await cp(source, project, { recursive: true });
    const config = JSON.parse(await readFile(path.join(project, '.beligent/config.json'), 'utf8')) as ProjectConfig;
    expect(await validateProjectRecords(project, config)).toEqual([]);
    const ticketPath = path.join(project, 'docs/sdd/tickets/TICKET-001.md');
    const original = await readFile(ticketPath, 'utf8');
    await writeFile(ticketPath, original.replace('specifications: [SPEC-001]', 'specifications: null'));
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('string list'))).toBe(true);
    await writeFile(ticketPath, original.replace('status: todo', 'status: done'));
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('done requires'))).toBe(true);
  });

  it('keeps schema 1 lightweight tickets ready with local criteria and no separate requirement or specification', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    config.profile = 'lightweight';
    await writeArtifact(path.join(project, config.tickets.paths.tickets, 'TICKET-001.md'), {
      id: 'TICKET-001', kind: 'ticket', title: 'Small isolated change', status: 'todo', readiness: 'ready', priority: 'low',
      requirements: [], specifications: [], acceptance_criteria: ['TICKET-001/AC-001'], dependencies: [], approval_refs: [], evidence: [],
    }, '# Small isolated change\n\n## Acceptance criteria\n\n### AC-001\n\nThe change has an observable result.\n');
    expect(await validateProjectRecords(project, config)).toEqual([]);
  });

  it('reports missing requirements/criteria, unlinked spec criteria, duplicate IDs and boolean revisions', async () => {
    const project = path.join(await tempdir(), 'example');
    await cp(path.join(root, 'examples/team-task-tracker'), project, { recursive: true });
    const config = JSON.parse(await readFile(path.join(project, '.beligent/config.json'), 'utf8')) as ProjectConfig;
    const ticketPath = path.join(project, 'docs/sdd/tickets/TICKET-001.md');
    const ticketText = await readFile(ticketPath, 'utf8');
    const metadata = parseFrontmatter(ticketText).data;

    await writeArtifact(ticketPath, { ...metadata, requirements: ['REQ-999'] }, '# Ticket\n');
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('unresolved requirements'))).toBe(true);
    await writeArtifact(ticketPath, { ...metadata, acceptance_criteria: ['SPEC-001/AC-999'] }, '# Ticket\n');
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('AC-999'))).toBe(true);

    await writeArtifact(path.join(project, 'docs/sdd/specifications/SPEC-002.md'), { id: 'SPEC-002', revision: 1, status: 'draft' }, '# Other specification\n\n## AC-001\nOther behavior.\n');
    await writeArtifact(ticketPath, { ...metadata, acceptance_criteria: ['SPEC-002/AC-001'] }, '# Ticket\n');
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('does not belong to a linked specification'))).toBe(true);

    await writeFile(ticketPath, ticketText);
    await cp(ticketPath, path.join(path.dirname(ticketPath), 'renamed-copy.md'));
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('Duplicate artifact ID'))).toBe(true);
    await rm(path.join(path.dirname(ticketPath), 'renamed-copy.md'));

    const requirementPath = path.join(project, 'docs/sdd/requirements/REQ-001.md');
    const requirement = parseFrontmatter(await readFile(requirementPath, 'utf8'));
    await writeArtifact(requirementPath, { ...requirement.data, revision: true }, requirement.body);
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('positive integer'))).toBe(true);
  });

  it('does not treat an illustrative approval or pending verification as completion', async () => {
    const project = path.join(await tempdir(), 'example');
    await cp(path.join(root, 'examples/team-task-tracker'), project, { recursive: true });
    const config = JSON.parse(await readFile(path.join(project, '.beligent/config.json'), 'utf8')) as ProjectConfig;
    const ticketPath = path.join(project, 'docs/sdd/tickets/TICKET-001.md');
    const ticket = parseFrontmatter(await readFile(ticketPath, 'utf8')).data;
    await writeArtifact(ticketPath, { ...ticket, status: 'done', approval_refs: ['APPR-001'], evidence: ['VERIFY-001'] }, '# Ticket\n');
    const errors = await validateProjectRecords(project, config);
    expect(errors.some((error) => error.includes('not a recorded real approval'))).toBe(true);
    expect(errors.some((error) => error.includes('done requires'))).toBe(true);
  });

  it('requires completion approval to cover the exact ticket ID', async () => {
    const project = path.join(await tempdir(), 'example');
    await cp(path.join(root, 'examples/team-task-tracker'), project, { recursive: true });
    const config = JSON.parse(await readFile(path.join(project, '.beligent/config.json'), 'utf8')) as ProjectConfig;
    const ticketPath = path.join(project, 'docs/sdd/tickets/TICKET-001.md');
    const ticket = parseFrontmatter(await readFile(ticketPath, 'utf8')).data;
    ticket.status = 'done';
    ticket.approval_refs = ['APPR-001'];
    await writeArtifact(ticketPath, ticket, '# Ticket\n');
    const approvalPath = path.join(project, 'docs/sdd/approvals/APPR-001.md');
    const approval = {
      id: 'APPR-001', revision: 1, status: 'approved', gate: 'completion', decision: 'approved',
      approver: 'Fixture reviewer', source: 'fixture://review/1',
      artifacts: [{ id: 'TICKET-0010', revision: 'fixture-snapshot' }],
    };
    await writeArtifact(approvalPath, approval, '# Test-only simulated decision\n');
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('done requires'))).toBe(true);
    approval.artifacts = [{ id: 'TICKET-001', revision: 'fixture-snapshot' }];
    await writeArtifact(approvalPath, approval, '# Test-only simulated decision\n');
    expect(await validateProjectRecords(project, config)).toEqual([]);
  });
});

describe('CLI', () => {
  function run(args: string[]) {
    return spawnSync(process.execPath, ['--import', 'tsx', path.join(root, 'src/cli/index.ts'), ...args], { cwd: root, encoding: 'utf8' });
  }

  it('prints version and returns expected usage/unknown-command exit codes', () => {
    const version = run(['version']);
    expect(version.status).toBe(0);
    expect(version.stdout.trim()).toBe('0.1.0');
    expect(run(['unknown']).status).toBe(2);
    expect(run(['validate', '--unknown']).status).toBe(2);
  });

  it('keeps the npm package version and VERSION file in sync', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { version: string };
    expect((await readFile(path.join(root, 'VERSION'), 'utf8')).trim()).toBe(pkg.version);
  });

  it('validates a project config and returns a nonzero exit status for bad config', async () => {
    const project = await tempdir();
    await mkdir(path.join(project, '.beligent'), { recursive: true });
    const config = await templateConfig();
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify(config));
    expect(run(['validate', '--config', path.join(project, '.beligent/config.json')]).status).toBe(0);
    config.schema_version = 3 as 1;
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify(config));
    expect(run(['validate', '--config', path.join(project, '.beligent/config.json')]).status).toBe(1);
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
    await mkdir(path.join(project, '.beligent'), { recursive: true });
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify(config));
    await mkdir(path.join(project, '.agents/skills/init-project'), { recursive: true });
    await writeFile(path.join(project, '.agents/skills/init-project/SKILL.md'), '---\nname: init-project\ndescription: setup\n---\n');
    const result = run(['doctor', project]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK configuration: schema 1');
    expect(result.stdout).toContain('init-project');
    expect(result.stderr).toContain('WARN skills not found');
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
