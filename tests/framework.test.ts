import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, symlink, link, cp, rm, stat, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stringify } from 'yaml';
import { configDefaults, locateConfig, parseConfig, pathIssue, validateConfig, type ProjectConfig } from '../src/validation/config.js';
import { localLinkErrors, parseFrontmatter, parseRecords, readRecordFiles, transitionErrors, validateProjectRecords } from '../src/validation/records.js';
import { computeSnapshot } from '../src/validation/git.js';
import { validateRepository } from '../src/validation/repository.js';
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

// Load tsx by absolute URL so the CLI can also run with a consumer project as its working directory.
const tsx = pathToFileURL(path.join(root, 'node_modules/tsx/dist/loader.mjs')).href;
function cli(args: string[], cwd = root) {
  return spawnSync(process.execPath, ['--import', tsx, path.join(root, 'src/cli/index.ts'), ...args], { cwd, encoding: 'utf8' });
}
async function fileExists(file: string): Promise<boolean> { try { await stat(file); return true; } catch { return false; } }
async function markdownFilesForTest(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFilesForTest(filename);
    return entry.isFile() && filename.endsWith('.md') ? [filename] : [];
  }));
  return contents.flat();
}

// v2 record fixtures --------------------------------------------------------

type Data = Record<string, unknown>;
type Check = Record<string, unknown>;
const minimal: ProjectConfig = { schema: 'beligent-sdd/config/v2', hosts: ['codex'] };
const A = `git-tree:${'a'.repeat(40)}`;
const B = `git-tree:${'b'.repeat(40)}`;
const dirs = { TICKET: 'tickets', EPIC: 'epics', SPEC: 'specs' } as const;
const criteria = (...ids: string[]): string => `# Record\n\n## Acceptance criteria\n\n${ids.map((id) => `### ${id}\n\n${id} behaves.\n`).join('\n')}`;

function ticket(overrides: Data = {}): Data {
  return { schema: 'beligent-sdd/ticket/v2', id: 'TICKET-001', title: 'Fix the label', status: 'todo', revision: 1, ...overrides };
}
function passing(overrides: Check = {}): Check {
  return { id: 'regression', criteria: ['AC-001'], required: true, command: 'npm test', coverage: 'added', outcome: 'pass', revision: 1, snapshot: A, ...overrides };
}
function done(overrides: Data = {}, checks: Check[] = [passing()]): Data {
  return ticket({ status: 'done', implementation: { base: '778afa1', snapshot: A }, checks, ...overrides });
}
function file(data: Data, body = criteria('AC-001')): { file: string; text: string } {
  const id = String(data.id);
  const prefix = id.split('-')[0] as keyof typeof dirs;
  return { file: `.sdd/beligent/${dirs[prefix] ?? 'tickets'}/${id}.md`, text: `---\n${stringify(data)}---\n${body}` };
}
async function writeProject(records: Array<{ file: string; text: string }>, config: ProjectConfig = minimal, project?: string): Promise<string> {
  const target = project ?? await tempdir();
  await mkdir(path.join(target, '.sdd/beligent'), { recursive: true });
  await writeFile(path.join(target, '.sdd/beligent/config.json'), JSON.stringify(config, null, 2));
  for (const record of records) {
    await mkdir(path.dirname(path.join(target, record.file)), { recursive: true });
    await writeFile(path.join(target, record.file), record.text);
  }
  return target;
}
async function errorsFor(records: Array<{ file: string; text: string }>, config: ProjectConfig = minimal): Promise<string> {
  const project = await writeProject(records, config);
  return (await validateProjectRecords(project, config)).join('\n');
}
function spec(id = 'SPEC-001', ids = ['AC-001', 'AC-002'], status = 'active'): { file: string; text: string } {
  return file({ schema: 'beligent-sdd/spec/v2', id, title: 'Shared behavior', status }, criteria(...ids));
}
function epic(status = 'todo'): { file: string; text: string } {
  return file({ schema: 'beligent-sdd/epic/v2', id: 'EPIC-001', title: 'Outcome', status }, '# Outcome\n');
}
function records(...entries: Array<{ file: string; text: string }>) { return parseRecords(entries).records; }

// Tests ----------------------------------------------------------------------

describe('v2 configuration', () => {
  async function template(): Promise<Data> {
    return JSON.parse(await readFile(path.join(root, 'skills/sdd-init/assets/config.json'), 'utf8')) as Data;
  }

  it('accepts the bundled template in repository mode and requires rendered values in a project', async () => {
    const config = await template();
    expect(validateConfig(config, true)).toEqual([]);
    expect(validateConfig(config).map((issue) => issue.message).join(' ')).toContain('unrendered');
    expect(config).toMatchObject({ tracking: { authorization: configDefaults.tracking.authorization }, delivery: configDefaults.delivery });
  });

  it('accepts a minimal and a full configuration', () => {
    expect(validateConfig(minimal)).toEqual([]);
    expect(validateConfig({
      schema: 'beligent-sdd/config/v2', hosts: ['claude-code', 'codex', 'github-copilot', 'cursor', 'devin'], project: { name: 'DPP' },
      stacks: ['nextjs', 'react-typescript'], checks: [{ id: 'unit', command: 'npm test', required: true }, { id: 'e2e', command: 'npm run e2e' }],
      tracking: { required_for: ['database migrations'], authorization: 'recorded' },
      delivery: { commit: 'allowed', push: 'ask', pull_request: 'never', delivered_at: 'push' },
    })).toEqual([]);
  });

  it.each([
    [{ schema_version: 1, hosts: ['codex'] }, 'earlier Beligent schema (schema_version 1)'],
    [{ schema_version: 2, schema: 'beligent-sdd/config/v2', hosts: ['codex'] }, 'earlier Beligent schema (schema_version 2)'],
    [{ hosts: ['codex'], tracking: { mode: 'opt-in' } }, 'no "schema" marker, so it predates v2'],
    [{ schema: 'beligent-sdd/config/v3', hosts: ['codex'] }, 'Unsupported schema "beligent-sdd/config/v3"'],
  ])('rejects an earlier or unknown schema with an actionable message: %j', (input, message) => {
    const before = structuredClone(input);
    const issues = validateConfig(input);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain(message);
    expect(issues[0]!.message).toContain('No files were changed');
    expect(input).toEqual(before);
  });

  it.each([
    { ...minimal, unexpected: true },
    { ...minimal, hosts: [] },
    { ...minimal, hosts: ['my-agent'] },
    { ...minimal, stacks: ['rails'] },
    { ...minimal, checks: [{ id: 'Unit', command: 'npm test' }] },
    { ...minimal, checks: [{ id: 'unit' }] },
    { ...minimal, tracking: { mode: 'always' } },
    { ...minimal, tracking: { authorization: 'manager' } },
    { ...minimal, delivery: { push: 'maybe' } },
    { ...minimal, delivery: { delivered_at: 'deploy' } },
    { ...minimal, project: { name: 'x', type: 'app' } },
  ])('rejects invalid values and unknown keys %#', (input) => {
    expect(validateConfig(input).length).toBeGreaterThan(0);
  });

  it('rejects duplicate check ids, duplicate JSON keys and invalid JSON', () => {
    expect(validateConfig({ ...minimal, checks: [{ id: 'unit', command: 'a' }, { id: 'unit', command: 'b' }] })[0]?.message).toContain("duplicate check id 'unit'");
    expect(() => parseConfig('{"a":1,"a":2}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"a":{"b":1,"b":2}}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"x":NaN}')).toThrow();
  });

  it('locates the v2 configuration and explains a missing or pre-v2 setup', async () => {
    const project = await tempdir();
    expect(locateConfig(project)).toEqual({ issue: expect.stringContaining('.sdd/beligent/config.json is missing') as string });
    await mkdir(path.join(project, '.beligent'));
    await writeFile(path.join(project, '.beligent/config.json'), '{"schema_version":2}');
    expect(locateConfig(project)).toEqual({ issue: expect.stringContaining('Pre-v2 Beligent setup found at .beligent/') as string });
    await writeProject([], minimal, project);
    expect(locateConfig(project)).toEqual({ path: path.join(project, '.sdd/beligent/config.json') });
  });

  it.each(['../outside', '/absolute', 'C:/outside', 'tests\\unit.ts', './tests', 'tests//unit.ts', ''])('rejects unsafe project-relative path %j', (value) => {
    expect(pathIssue(value)).toBeDefined();
  });

  it('rejects symlinked and hard-linked project paths', async () => {
    const project = await tempdir();
    const outside = await tempdir();
    await symlink(outside, path.join(project, 'escape'));
    expect(pathIssue('escape/test.ts', project)).toContain('symlink');
    await writeFile(path.join(outside, 'shared.ts'), 'x');
    await link(path.join(outside, 'shared.ts'), path.join(project, 'linked.ts'));
    expect(pathIssue('linked.ts', project)).toContain('hard-linked');
    expect(pathIssue('src/new.test.ts', project)).toBeUndefined();
  });
});

describe('v2 records', () => {
  it('accepts a minimal open ticket and a standalone done ticket without epic, spec, approval or delivery', async () => {
    expect(await errorsFor([file(ticket())])).toBe('');
    expect(await errorsFor([file(done())])).toBe('');
  });

  it('accepts tickets that use an optional epic and a shared spec', async () => {
    const member = (id: string, criterion: string) => file(done({ id, epic: 'EPIC-001', spec_criteria: [criterion] }, [passing({ criteria: [criterion] })]), '# Shared\n');
    expect(await errorsFor([spec(), epic('done'), member('TICKET-001', 'SPEC-001/AC-001'), member('TICKET-002', 'SPEC-001/AC-002')])).toBe('');
    expect(await errorsFor([spec(), epic('done'), member('TICKET-001', 'SPEC-001/AC-001'), file(ticket({ id: 'TICKET-002', epic: 'EPIC-001' }))])).toContain('a done epic needs member tickets that are all done or cancelled');
    expect(await errorsFor([epic('done')])).toContain('a done epic needs member tickets');
  });

  it('requires local criteria and listed spec criteria together', async () => {
    const record = done({ spec_criteria: ['SPEC-001/AC-001'] }, [passing({ criteria: ['SPEC-001/AC-001'] })]);
    expect(await errorsFor([spec(), file(record)])).toContain('no passing current required check covers TICKET-001/AC-001');
    const both = done({ spec_criteria: ['SPEC-001/AC-001'] }, [passing({ criteria: ['AC-001', 'SPEC-001/AC-001'] })]);
    expect(await errorsFor([spec(), file(both)])).toBe('');
  });

  it('resolves spec references for open tickets only, so later spec edits never break done tickets', async () => {
    expect(await errorsFor([file(ticket({ spec_criteria: ['SPEC-009/AC-001'] }))])).toContain('unresolved spec SPEC-009');
    expect(await errorsFor([spec(), file(ticket({ spec_criteria: ['SPEC-001/AC-009'] }))])).toContain('unresolved spec criterion SPEC-001/AC-009');
    const closed = done({ spec_criteria: ['SPEC-001/AC-002'] }, [passing({ criteria: ['SPEC-001/AC-002'] })]);
    expect(await errorsFor([spec('SPEC-001', ['AC-001']), file(closed, '# Done\n')])).toBe('');
    expect(await errorsFor([file(done({}, [passing({ criteria: ['SPEC-001/AC-001'] })]))])).toContain('not one of this ticket\'s criteria');
  });

  it('enforces identity, markers and fixed record locations', async () => {
    const renamed = { ...file(ticket()), file: '.sdd/beligent/tickets/label-fix.md' };
    expect(await errorsFor([renamed])).toContain('file name must be TICKET-001.md');
    expect(await errorsFor([file(ticket({ id: 'TICKET-1' }))])).toContain('id must look like TICKET-001');
    const legacy = { file: '.sdd/beligent/tickets/TICKET-001.md', text: '---\nid: TICKET-001\nkind: ticket\nstatus: todo\nreadiness: ready\napproval_refs: []\n---\n# Old\n' };
    expect(await errorsFor([legacy])).toContain('pre-v2 record (no schema marker). Recreate it from the v2 template');
    expect(await errorsFor([file(ticket({ readiness: 'ready', priority: 'high' }))])).toContain('unknown fields readiness, priority');
    expect(await errorsFor([{ ...file(ticket()), text: file(ticket()).text.replace('ticket/v2', 'epic/v2') }])).toContain('expected schema "beligent-sdd/ticket/v2"');
    expect(await errorsFor([{ ...file(ticket()), file: '.sdd/beligent/tickets/archive/TICKET-001.md' }])).toContain('records live directly in .sdd/beligent/tickets/');
    expect(await errorsFor([file(ticket(), '# No criteria\n')])).toContain('needs at least one ### AC-001 criterion');
    expect(await errorsFor([file(ticket(), criteria('AC-001', 'AC-001'))])).toContain('duplicate criterion headings');
    expect(await errorsFor([file(ticket({ revision: true }))])).toContain('revision must be a positive integer');
  });

  it('validates dependencies, epics and status reasons', async () => {
    expect(await errorsFor([file(ticket({ depends_on: ['TICKET-001'] }))])).toContain('cannot depend on itself');
    expect(await errorsFor([file(ticket({ depends_on: ['TICKET-002'] })), file(ticket({ id: 'TICKET-002', depends_on: ['TICKET-001'] }))])).toContain('Dependency cycle');
    expect(await errorsFor([file(ticket({ depends_on: ['TICKET-404'] }))])).toContain('unresolved dependency TICKET-404');
    expect(await errorsFor([file(ticket({ epic: 'EPIC-404' }))])).toContain('unresolved epic EPIC-404');
    expect(await errorsFor([file(ticket({ status: 'blocked' }))])).toContain('blocked requires blocked_reason');
    expect(await errorsFor([file(ticket({ status: 'blocked', blocked_reason: 'Staging API is down' }))])).toBe('');
    expect(await errorsFor([file(ticket({ blocked_reason: 'stale' }))])).toContain('blocked_reason is only valid when status is blocked');
    expect(await errorsFor([file(ticket({ status: 'cancelled' }))])).toContain('cancelled requires cancelled_reason');
    expect(await errorsFor([file(ticket({ status: 'review' }))])).toContain('status must be one of');
  });

  it.each(['fail', 'blocked', 'not-run'])('keeps a ticket open while a required check is %s', async (outcome) => {
    expect(await errorsFor([file(done({}, [passing({ outcome })]))])).toContain(`required check 'regression' is ${outcome}; the ticket stays open`);
    expect(await errorsFor([file(done({ status: 'in-progress' }, [passing({ outcome })]))])).toBe('');
  });

  it('requires a current snapshot, revision and coverage for every criterion before done', async () => {
    expect(await errorsFor([file(done({ implementation: undefined }))])).toContain('done requires implementation');
    expect(await errorsFor([file(done({ implementation: { base: 'x', snapshot: 'sha256:abc' } }))])).toContain('implementation needs base');
    expect(await errorsFor([file(done({}, [passing({ snapshot: B })]))])).toContain("required check 'regression' is stale");
    expect(await errorsFor([file(done({ revision: 2, history: [{ event: 'revised', revision: 1, reason: 'Added AC-002' }] }))])).toContain('is stale');
    expect(await errorsFor([file(done(), criteria('AC-001', 'AC-002'))])).toContain('no passing current required check covers TICKET-001/AC-002');
    expect(await errorsFor([file(done({}, [passing({ required: false })]))])).toContain('no passing current required check covers TICKET-001/AC-001');
    expect(await errorsFor([file(done({ checks: undefined }))])).toContain('no passing current required check');
    expect(await errorsFor([file(done({}, [passing({ coverage: undefined })]))])).toContain('coverage must be added, updated or existing');
  });

  it('requires configured required checks to pass for every closure', async () => {
    const config: ProjectConfig = { ...minimal, checks: [{ id: 'unit', command: 'npm test', required: true }, { id: 'e2e', command: 'npm run e2e' }] };
    expect(await errorsFor([file(done())], config)).toContain("configured required check 'unit' has no passing current result");
    const unit = { id: 'unit', required: true, command: 'npm test', outcome: 'pass', revision: 1, snapshot: A };
    expect(await errorsFor([file(done({}, [passing(), unit]))], config)).toBe('');
    expect(await errorsFor([file(done({}, [passing(), { ...unit, id: 'lint' }]))], config)).toContain("check 'lint' needs criteria or must match a configured check id");
  });

  it('requires recorded authorization for the current revision when the project asks for it', async () => {
    const config: ProjectConfig = { ...minimal, tracking: { authorization: 'recorded' } };
    const authorization = { revision: 1, by: 'Dana Lee', source: 'PR #117 comment' };
    expect(await errorsFor([file(ticket())], config)).toBe('');
    expect(await errorsFor([file(ticket({ status: 'in-progress' }))], config)).toContain('requires recorded authorization');
    expect(await errorsFor([file(done({ authorization: { ...authorization, revision: 2 } }))], config)).toContain('requires recorded authorization');
    expect(await errorsFor([file(done({ authorization }))], config)).toBe('');
    expect(await errorsFor([file(ticket({ authorization: { by: 'Dana' } }))])).toContain('authorization needs revision, by and source');
  });

  it('records manual checks with observations and a reason when automation is not practical', async () => {
    const manual = { id: 'ios-visual', criteria: ['AC-001'], required: true, procedure: 'Open /passport at 320px', observed: 'Label wraps', by: 'assistant', outcome: 'pass', revision: 1, snapshot: A };
    expect(await errorsFor([file(done({}, [manual]))])).toContain('verified only manually; give a reason');
    expect(await errorsFor([file(done({}, [{ ...manual, reason: 'Layout needs a real browser' }]))])).toBe('');
    expect(await errorsFor([file(done({}, [passing(), manual]))])).toBe('');
    expect(await errorsFor([file(done({}, [{ ...manual, observed: undefined }]))])).toContain('is manual and needs observed and by');
    expect(await errorsFor([file(done({}, [{ ...manual, command: 'npm test' }]))])).toContain('exactly one of command or procedure');
    expect(await errorsFor([file(done({}, [passing(), { ...manual, snapshot: B, carried_forward: 'Only server code changed since' }]))])).toBe('');
    expect(await errorsFor([file(done({}, [passing({ snapshot: B, carried_forward: 'unchanged' })]))])).toContain('carried_forward is only for manual checks');
  });

  it('validates optional, not-applicable and malformed checks', async () => {
    expect(await errorsFor([file(done({}, [passing(), passing({ id: 'perf', required: false, outcome: 'fail' })]))])).toBe('');
    expect(await errorsFor([file(done({}, [passing(), passing({ id: 'a11y', required: false, outcome: 'not-applicable', reason: 'No UI change' })]))])).toBe('');
    expect(await errorsFor([file(done({}, [passing({ outcome: 'not-applicable', reason: 'x' })]))])).toContain('not-applicable only when optional');
    expect(await errorsFor([file(done({}, [passing(), passing()]))])).toContain('duplicate check ids');
    expect(await errorsFor([file(done({}, [passing({ tests: ['../outside.test.ts'] })]))])).toContain('test path ../outside.test.ts must be a safe project-relative POSIX path');
    expect(await errorsFor([file(done({}, [passing({ before: 'pass' })]))])).toContain('before can only be fail');
    expect(await errorsFor([file(done({}, [passing({ revision: 3 })]))])).toContain('needs the ticket revision it verified');
    expect(await errorsFor([file(done({}, [passing({ at: 'yesterday' })]))])).toContain('at must be an ISO date-time');
    expect(await errorsFor([file(done({}, [passing({ extra: 1 })]))])).toContain('unknown fields extra');
    expect(await errorsFor([file(done({ history: [{ event: 'revised', revision: 1, reason: 'x' }] }))])).toContain('history entries need event: revised, an earlier revision');
  });

  it('keeps delivery independent of completion while validating declared delivery facts', async () => {
    expect(await errorsFor([file(ticket({ delivery: { state: 'pr-open', reference: 'https://example.test/pull/1' } }))])).toBe('');
    expect(await errorsFor([file(done({ delivery: { state: 'blocked', reason: 'Push permission pending' } }))])).toBe('');
    expect(await errorsFor([file(done({ delivery: { state: 'committed' } }))])).toContain('delivery committed needs an observed reference');
    expect(await errorsFor([file(done({ delivery: { state: 'delivered', reference: 'abc', point: 'commit' } }))])).toContain("configured delivery point 'merged-pr'");
    expect(await errorsFor([file(done({ delivery: { state: 'delivered', reference: 'abc', point: 'push' } }))], { ...minimal, delivery: { delivered_at: 'push' } })).toBe('');
    expect(await errorsFor([file(done({ delivery: { state: 'ready-for-delivery' } }))])).toContain('delivery.state must be');
  });
});

describe('final states and revisions between record versions', () => {
  const base = file(ticket({ status: 'in-progress' }));
  it('treats done and cancelled as final except for delivery', () => {
    const closed = file(done());
    expect(transitionErrors(records(closed), records(file(done({ status: 'todo' }))))).toEqual([expect.stringContaining('TICKET-001: done is final; only delivery may change')]);
    expect(transitionErrors(records(closed), records(file(done(), criteria('AC-001', 'AC-002'))))).toHaveLength(1);
    expect(transitionErrors(records(closed), records(file(done({ delivery: { state: 'pushed', reference: 'abc' } }))))).toEqual([]);
    expect(transitionErrors(records(closed), [])).toEqual(['TICKET-001: a done record cannot be deleted']);
    const cancelled = file(ticket({ status: 'cancelled', cancelled_reason: 'Out of scope' }));
    expect(transitionErrors(records(cancelled), records(file(ticket())))).toEqual([expect.stringContaining('cancelled is final')]);
    expect(transitionErrors(records(epic('done')), records(epic('todo')))).toEqual([expect.stringContaining('EPIC-001: done is final')]);
  });

  it('requires a revision and preserved history when open criteria change', () => {
    const changed = (data: Data) => records(file(ticket({ status: 'in-progress', ...data }), criteria('AC-001', 'AC-002')));
    expect(transitionErrors(records(base), changed({}))).toEqual(['TICKET-001: criteria changed without incrementing revision']);
    expect(transitionErrors(records(base), changed({ revision: 2 }))).toEqual(['TICKET-001: revision 2 needs a revised history entry for revision 1']);
    const history = [{ event: 'revised', revision: 1, reason: 'Added AC-002', criteria: ['AC-001'] }];
    expect(transitionErrors(records(base), changed({ revision: 2, history }))).toEqual([]);
    expect(transitionErrors(changed({ revision: 2, history }), records(file(ticket({ status: 'in-progress', revision: 2 }), criteria('AC-001', 'AC-002'))))).toEqual(['TICKET-001: history entries must be preserved']);
    expect(transitionErrors(changed({ revision: 2, history }), records(base))).toContain('TICKET-001: revision cannot decrease');
    expect(transitionErrors(records(spec()), records(spec('SPEC-001', ['AC-001'])))).toEqual([]);
    expect(transitionErrors(records(base), records(file(ticket({ status: 'done' }))))).toEqual([]);
  });
});

describe('Git snapshots and validate options', () => {
  function git(cwd: string, ...args: string[]): string {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  }
  async function repository(): Promise<string> {
    const project = await writeProject([file(ticket({ status: 'in-progress' }))]);
    await writeFile(path.join(project, 'app.js'), 'export const label = "Passport";\n');
    await writeFile(path.join(project, '.gitignore'), 'ignored.log\n');
    git(project, 'init', '-q');
    git(project, 'config', 'user.email', 'fixture@example.test');
    git(project, 'config', 'user.name', 'Fixture');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'fixture');
    return project;
  }

  it('identifies the working tree without the records and without touching the index', async () => {
    const project = await repository();
    const first = computeSnapshot(project);
    expect(first.base).toBe(git(project, 'rev-parse', 'HEAD'));
    expect(first.snapshot).toMatch(/^git-tree:[0-9a-f]{40}$/);
    expect(computeSnapshot(project)).toEqual(first);
    const index = (await stat(path.join(project, '.git/index'), { bigint: true })).mtimeNs;
    await writeFile(path.join(project, '.sdd/beligent/tickets/TICKET-001.md'), file(done()).text);
    await writeFile(path.join(project, 'ignored.log'), 'noise');
    expect(computeSnapshot(project).snapshot).toBe(first.snapshot);
    await writeFile(path.join(project, 'app.js'), 'export const label = "Pass";\n');
    const edited = computeSnapshot(project).snapshot;
    expect(edited).not.toBe(first.snapshot);
    await writeFile(path.join(project, 'new.test.js'), 'test');
    expect(computeSnapshot(project).snapshot).not.toBe(edited);
    expect((await stat(path.join(project, '.git/index'), { bigint: true })).mtimeNs).toBe(index);
    expect(git(project, 'status', '--porcelain')).toContain('?? new.test.js');
  });

  it('prints the snapshot and checks a recorded ticket snapshot against the working tree', async () => {
    const project = await repository();
    const printed = cli(['snapshot', project]);
    expect(printed.status).toBe(0);
    const snapshot = /snapshot: (\S+)/.exec(printed.stdout)![1]!;
    await writeFile(path.join(project, '.sdd/beligent/tickets/TICKET-001.md'), file(done({ implementation: { base: 'abc', snapshot } }, [passing({ snapshot })])).text);
    expect(cli(['validate', project, '--snapshot', 'TICKET-001']).status).toBe(0);
    await writeFile(path.join(project, 'app.js'), 'changed\n');
    const stale = cli(['validate', project, '--snapshot', 'TICKET-001']);
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain('does not match the working tree');
    expect(cli(['snapshot', await tempdir()]).stderr).toContain('a Git working tree is required');
  });

  it('enforces final states against a Git revision with --since', async () => {
    const project = await repository();
    const record = path.join(project, '.sdd/beligent/tickets/TICKET-001.md');
    await writeFile(record, file(done()).text);
    git(project, 'commit', '-qam', 'close ticket');
    expect(cli(['validate', project, '--since', 'HEAD']).status).toBe(0);
    await writeFile(record, file(done({ status: 'in-progress' })).text);
    const reopened = cli(['validate', project, '--since', 'HEAD']);
    expect(reopened.status).toBe(1);
    expect(reopened.stderr).toContain('done is final');
    expect(cli(['validate', project, '--since', 'no-such-ref']).stderr).toContain("unknown Git revision 'no-such-ref'");
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
    expect((await syncAssets(project, true)).some((error) => error.includes('Missing canonical source'))).toBe(true);
    expect(await readFile(path.join(project, source.destination), 'utf8')).toBe('untouched');
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

describe('repository validation', () => {
  it('validates the checked-in five-skill repository, templates and fixture', async () => {
    expect(await validateRepository(root)).toEqual([]);
  });

  it('rejects duplicate YAML keys and links outside a skill package', async () => {
    expect(() => parseFrontmatter('---\na: 1\na: 2\n---\nbody')).toThrow();
    const dir = await tempdir();
    await writeFile(path.join(dir, 'page.md'), '[escape](../outside.md)');
    expect((await localLinkErrors(path.join(dir, 'page.md'), dir)).some((error) => error.includes('escapes'))).toBe(true);
    await mkdir(path.join(dir, 'references'));
    await writeFile(path.join(dir, 'references/guide.md'), '# Guide\n\n## Section\n');
    await writeFile(path.join(dir, 'page.md'), '[guide](references/guide.md#section)');
    expect(await localLinkErrors(path.join(dir, 'page.md'), dir)).toEqual([]);
    await writeFile(path.join(dir, 'page.md'), '[missing](references/nope.md)');
    expect((await localLinkErrors(path.join(dir, 'page.md'), dir)).some((error) => error.includes('missing local link'))).toBe(true);
    await writeFile(path.join(dir, 'page.md'), '[bad anchor](references/guide.md#nope)');
    expect((await localLinkErrors(path.join(dir, 'page.md'), dir)).some((error) => error.includes('missing local anchor'))).toBe(true);
  });

  it('validates the copied Copilot fragment from its eventual project destination', async () => {
    const project = await writeProject([]);
    await writeFile(path.join(project, 'AGENTS.md'), '# Existing instructions\n');
    await mkdir(path.join(project, '.github'), { recursive: true });
    await cp(path.join(root, 'skills/sdd-init/assets/copilot.fragment.md'), path.join(project, '.github/copilot-instructions.md'));
    expect(await localLinkErrors(path.join(project, '.github/copilot-instructions.md'), project)).toEqual([]);
  });

  it('checks installed skill copies after their source checkout is unavailable', async () => {
    const copied = path.join(await tempdir(), 'skills');
    await cp(path.join(root, 'skills'), copied, { recursive: true });
    for (const skill of skills) {
      const boundary = path.join(copied, skill);
      for (const document of await markdownFilesForTest(boundary)) {
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
  it('prints version and returns expected usage/unknown-command exit codes', () => {
    const version = cli(['version']);
    expect(version.status).toBe(0);
    expect(version.stdout.trim()).toBe('1.0.0');
    expect(cli(['unknown']).status).toBe(2);
    expect(cli(['validate', '--unknown']).status).toBe(2);
    expect(cli(['validate', '--since']).status).toBe(2);
    expect(cli(['validate', '--config', 'x.json']).status).toBe(2);
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
    const footer = cli(['usage', 'footer', '--agent', 'codex', '--skill', 'sdd-define', '--file', codex]);
    expect(footer.status).toBe(0);
    expect(footer.stdout.trim()).toBe('Token usage — sdd-define (codex): 125 total | 100 input | 40 cached input | 0 cache write | 25 output | 5 reasoning');
    expect(cli(['usage', 'import', '--agent', 'codex', '--skill', 'sdd-define', '--file', codex, '--task', 'TICKET-1', '--store', store]).status).toBe(0);
    expect(cli(['usage', 'import', '--agent', 'claude', '--skill', 'sdd-implement', '--file', claude, '--store', store]).status).toBe(0);
    expect(cli(['usage', 'import', '--agent', 'codex', '--skill', 'sdd-define', '--file', codex, '--task', 'TICKET-1', '--store', store]).stdout).toContain('already imported');
    const report = cli(['usage', 'report', '--store', store, '--json']);
    expect(report.status).toBe(0);
    const summary = JSON.parse(report.stdout) as Array<{ skill: string; total_tokens: number; cost_usd: number }>;
    expect(summary.find((item) => item.skill === 'sdd-define')?.total_tokens).toBe(125);
    expect(summary.find((item) => item.skill === 'sdd-implement')).toMatchObject({ total_tokens: 79, cost_usd: 0.012 });
    expect(await readFile(store, 'utf8')).not.toContain('private prompt');
  });

  it('validates a project and rejects invalid records, pre-v2 locations and earlier schemas', async () => {
    const project = await writeProject([file(done())]);
    expect(cli(['validate', project]).status).toBe(0);
    expect(cli(['validate'], project).status).toBe(0);
    await writeProject([file(done({}, [passing({ outcome: 'fail' })]))], minimal, project);
    const failing = cli(['validate', project]);
    expect(failing.status).toBe(1);
    expect(failing.stderr).toContain('the ticket stays open');
    await writeFile(path.join(project, '.sdd/beligent/config.json'), JSON.stringify({ hosts: ['codex'] }));
    expect(cli(['validate', project]).stderr).toContain('predates v2');
    const legacy = await tempdir();
    await mkdir(path.join(legacy, '.beligent'));
    await writeFile(path.join(legacy, '.beligent/config.json'), '{"schema_version":2}');
    const result = cli(['validate', legacy]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Pre-v2 Beligent setup found at .beligent/');
    expect(await readFile(path.join(legacy, '.beligent/config.json'), 'utf8')).toBe('{"schema_version":2}');
  });

  it('doctor reports a missing config and absent skills without modifying the target', async () => {
    const project = await tempdir();
    const result = cli(['doctor', project]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('config.json is missing');
    expect(result.stderr).toContain('WARN skills not found');
    expect(await readdir(project)).toEqual([]);
  });

  it('doctor summarizes a valid config, installed skills, duplicates and pre-v2 leftovers', async () => {
    const project = await writeProject([], { ...minimal, stacks: ['nodejs'] });
    for (const destination of ['.agents/skills/sdd-implement', '.claude/skills/sdd-implement', '.agents/skills/develop-task']) {
      await mkdir(path.join(project, destination), { recursive: true });
      await writeFile(path.join(project, destination, 'SKILL.md'), '---\nname: x\ndescription: x\n---\n');
    }
    await mkdir(path.join(project, '.beligent'));
    const result = cli(['doctor', project]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK configuration: hosts codex; stacks nodejs; authorization request');
    expect(result.stderr).toContain('duplicate discovery risk: sdd-implement');
    expect(result.stderr).toContain('pre-v2 skill .agents/skills/develop-task');
    expect(result.stderr).toContain('pre-v2 .beligent/ directory found');
    expect(result.stderr).toContain('sdd-deliver');
  });
});

describe('selected host package plans', () => {
  it.each(Object.keys(hostRoots) as (keyof typeof hostRoots)[])('copies only selected %s integration and shared guidance, twice without rewriting', async (host) => {
    const project = await tempdir();
    const files = await prepareHostPackage(root, [host], ['python']);
    await writeFile(path.join(project, 'AGENTS.md'), 'Handwritten instructions\n');
    expect(await preflightHostPackage(project, files)).toEqual([]);
    for (const entry of files) { await mkdir(path.dirname(path.join(project, entry.path)), { recursive: true }); await writeFile(path.join(project, entry.path), entry.bytes); }
    const sample = path.join(project, hostRoots[host], 'sdd-implement/SKILL.md');
    const timestamp = (await stat(sample, { bigint: true })).mtimeNs;
    expect(await preflightHostPackage(project, await prepareHostPackage(root, [host], ['python']))).toEqual([]);
    expect((await stat(sample, { bigint: true })).mtimeNs).toBe(timestamp);
    expect(await readFile(path.join(project, 'AGENTS.md'), 'utf8')).toBe('Handwritten instructions\n');
    for (const skill of skills) expect(await readFile(path.join(project, hostRoots[host], skill, 'SKILL.md'))).toEqual(await readFile(path.join(root, 'skills', skill, 'SKILL.md')));
    expect(await fileExists(path.join(project, '.sdd/beligent/tickets'))).toBe(false);
    expect(await fileExists(path.join(project, '.sdd/beligent/guidance/python.md'))).toBe(true);
    expect(await fileExists(path.join(project, '.sdd/beligent/guidance/nextjs.md'))).toBe(false);
    for (const entry of files.filter((item) => item.path.startsWith('.sdd/beligent/guidance/'))) expect(await localLinkErrors(path.join(project, entry.path), project)).toEqual([]);
  });

  it('deduplicates a shared Codex/Copilot root and refuses unreviewed content or unsafe paths', async () => {
    const project = await tempdir();
    const files = await prepareHostPackage(root, ['codex', 'github-copilot']);
    expect(files.filter((entry) => entry.path.endsWith('/SKILL.md'))).toHaveLength(5);
    const guide = files.find((entry) => entry.path.endsWith('guidance/engineering.md'))!;
    await mkdir(path.dirname(path.join(project, guide.path)), { recursive: true });
    await writeFile(path.join(project, guide.path), 'Local edited guidance');
    expect((await preflightHostPackage(project, files)).join(' ')).toContain('reviewed merge');
    expect((await preflightHostPackage(project, [{ path: '../escape', bytes: Buffer.from('x') }])).join(' ')).toContain('Unsafe');
  });
});

describe('workflow fixture', () => {
  const example = path.join(root, 'examples/workflow-fixture');

  it('validates the fixture graph and runs its direct, tracked, failing and post-close scenarios', async () => {
    expect(await validateProjectRecords(example, minimal)).toEqual([]);
    const { records: parsed } = parseRecords((await readRecordFiles(example)).files);
    expect(parsed.map((record) => `${record.id}:${String(record.data.status)}`).sort()).toEqual(['EPIC-001:done', 'SPEC-001:active', 'TICKET-001:done', 'TICKET-002:done', 'TICKET-003:done', 'TICKET-004:in-progress']);
    const run = spawnSync(process.execPath, ['run-scenarios.mjs'], { cwd: example, encoding: 'utf8' });
    expect(run.status, run.stdout + run.stderr).toBe(0);
    expect(run.stdout).toContain('direct fix and tracked implementation: PASS');
    expect(run.stdout).toContain('required failure keeps tracked work open: expected FAIL');
    expect(run.stdout).toContain('post-close audit finds a regression in done work: expected FAIL');
  });

  it('rejects the invalid closure case and an epic with an open member', async () => {
    const project = await tempdir();
    await cp(example, project, { recursive: true });
    await cp(path.join(example, 'cases/invalid-done.md'), path.join(project, '.sdd/beligent/tickets/TICKET-999.md'));
    expect((await validateProjectRecords(project, minimal)).join(' ')).toContain("TICKET-999: required check 'label-regression' is fail");
    const member = path.join(project, '.sdd/beligent/tickets/TICKET-003.md');
    await writeFile(member, (await readFile(member, 'utf8')).replace('status: done', 'status: in-progress'));
    expect((await validateProjectRecords(project, minimal)).join(' ')).toContain('EPIC-001: a done epic needs member tickets');
  });
});
