import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, symlink, link, cp, rm, stat, readdir, chmod } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stringify } from 'yaml';
import { locateConfig, parseConfig, pathIssue, validateConfig, type ProjectConfig } from '../src/validation/config.js';
import { localLinkErrors, parseFrontmatter, parseRecords, readRecordFiles, validateProjectRecords } from '../src/validation/records.js';
import { validateRepository } from '../src/validation/repository.js';
import { mappings, skills, syncAssets } from '../src/packaging/sync-assets.js';
import { hostIds, hostTargets, type HostId } from '../src/packaging/hosts.js';
import { END, START, applyInstall, conflicts, mergeSection, pending, planInstall } from '../src/packaging/install.js';
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

// Record fixtures -----------------------------------------------------------

type Data = Record<string, unknown>;
type Check = Record<string, unknown>;
const minimal: ProjectConfig = { schema: 'beligent-sdd/config', hosts: ['codex'] };
const body = (...ids: string[]): string => `# Ticket\n\n## Context\n\nWhy.\n\n## Requirements\n\nBuild the behavior.\n\n## Acceptance criteria\n\n${ids.map((id) => `### ${id}\n\n${id} behaves.\n`).join('\n')}\n## Out of scope\n\nEverything else.\n`;

function ticket(overrides: Data = {}): Data {
  return { schema: 'beligent-sdd/ticket', id: 'TICKET-001', title: 'Fix the label', status: 'todo', ...overrides };
}
function passing(overrides: Check = {}): Check {
  return { id: 'regression', criteria: ['AC-001'], command: 'npm test', outcome: 'pass', ...overrides };
}
function done(overrides: Data = {}, checks: Check[] = [passing()]): Data {
  return ticket({ status: 'done', checks, ...overrides });
}
function file(data: Data, text = body('AC-001')): { file: string; text: string } {
  return { file: `.sdd/beligent/tickets/${String(data.id)}.md`, text: `---\n${stringify(data)}---\n${text}` };
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

// Tests ----------------------------------------------------------------------

describe('configuration', () => {
  async function template(): Promise<Data> {
    return JSON.parse(await readFile(path.join(root, 'skills/sdd-init/assets/config.json'), 'utf8')) as Data;
  }

  it('accepts the bundled template in repository mode and requires rendered values in a project', async () => {
    const config = await template();
    expect(validateConfig(config, true)).toEqual([]);
    expect(validateConfig(config).map((issue) => issue.message).join(' ')).toContain('unrendered');
    expect(Object.keys(config).sort()).toEqual(['checks', 'hosts', 'project', 'schema', 'stacks']);
  });

  it('accepts a minimal and a full configuration', () => {
    expect(validateConfig(minimal)).toEqual([]);
    expect(validateConfig({
      schema: 'beligent-sdd/config', hosts: ['claude-code', 'codex', 'github-copilot', 'cursor'], project: { name: 'DPP' },
      stacks: ['nextjs', 'react-typescript'], checks: [{ id: 'unit', command: 'npm test', required: true }, { id: 'e2e', command: 'npm run e2e' }],
    })).toEqual([]);
  });

  it.each([
    [{ schema_version: 1, hosts: ['codex'] }, 'earlier Beligent SDD schema (schema_version 1)'],
    [{ schema_version: 2, schema: 'beligent-sdd/config', hosts: ['codex'] }, 'earlier Beligent SDD schema (schema_version 2)'],
    [{ hosts: ['codex'], tracking: { mode: 'opt-in' } }, 'no "schema" marker, so it predates Beligent SDD 1.0'],
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
    { ...minimal, stacks: ['rails'] },
    { ...minimal, checks: [{ id: 'Unit', command: 'npm test' }] },
    { ...minimal, checks: [{ id: 'unit' }] },
    { ...minimal, tracking: { authorization: 'request' } },
    { ...minimal, delivery: { commit: 'ask' } },
    { ...minimal, project: { name: 'x', type: 'app' } },
  ])('rejects invalid values and unknown keys %#', (input) => {
    expect(validateConfig(input).length).toBeGreaterThan(0);
  });

  it('accepts host names the framework does not support, so they can be ignored', () => {
    expect(validateConfig({ ...minimal, hosts: ['codex', 'my-agent'] })).toEqual([]);
    expect(validateConfig({ ...minimal, hosts: [''] }).length).toBeGreaterThan(0);
  });

  it('rejects duplicate check ids, duplicate JSON keys and invalid JSON', () => {
    expect(validateConfig({ ...minimal, checks: [{ id: 'unit', command: 'a' }, { id: 'unit', command: 'b' }] })[0]?.message).toContain("duplicate check id 'unit'");
    expect(() => parseConfig('{"a":1,"a":2}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"a":{"b":1,"b":2}}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"x":NaN}')).toThrow();
  });

  it('locates the configuration and explains a missing or pre-1.0 setup', async () => {
    const project = await tempdir();
    expect(locateConfig(project)).toEqual({ issue: expect.stringContaining('.sdd/beligent/config.json is missing') as string });
    await mkdir(path.join(project, '.beligent'));
    await writeFile(path.join(project, '.beligent/config.json'), '{"schema_version":2}');
    expect(locateConfig(project)).toEqual({ issue: expect.stringContaining('Pre-1.0 Beligent SDD setup found at .beligent/') as string });
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

describe('tickets', () => {
  it('accepts a minimal open ticket and a done ticket with passing checks', async () => {
    expect(await errorsFor([file(ticket())])).toBe('');
    expect(await errorsFor([file(done())])).toBe('');
  });

  it('requires defined requirements and criteria with text', async () => {
    expect(await errorsFor([file(ticket(), body('AC-001').replace('Build the behavior.', ''))])).toContain('needs a nonempty ## Requirements section');
    expect(await errorsFor([file(ticket(), '# No sections\n')])).toContain('needs at least one ### AC-001 criterion');
    expect(await errorsFor([file(ticket(), body('AC-001').replace('AC-001 behaves.', ''))])).toContain('AC-001 needs text describing an observable result');
    expect(await errorsFor([file(ticket(), body('AC-001', 'AC-001'))])).toContain('duplicate criterion headings');
    expect(await errorsFor([file(ticket(), body('AC-001').replace('Build the behavior.', '<!-- fill in -->\n```\nexample\n```'))])).toContain('needs a nonempty ## Requirements section');
    expect(await errorsFor([file(ticket(), body('AC-001').replace(/\n/g, '\r\n'))])).toBe('');
  });

  it('enforces identity, markers and the single ticket folder', async () => {
    expect(await errorsFor([{ ...file(ticket()), file: '.sdd/beligent/tickets/label-fix.md' }])).toContain('file name must be TICKET-001.md');
    expect(await errorsFor([file(ticket({ id: 'TICKET-1' }))])).toContain('id must look like TICKET-001');
    const legacy = { file: '.sdd/beligent/tickets/TICKET-001.md', text: '---\nid: TICKET-001\nkind: ticket\nstatus: todo\n---\n# Old\n' };
    expect(await errorsFor([legacy])).toContain('pre-1.0 record (no schema marker). Recreate it from the current template');
    expect(await errorsFor([file(ticket({ schema: 'beligent-sdd/ticket/v2' }))])).toContain('expected schema "beligent-sdd/ticket"');
    for (const field of ['revision', 'epic', 'spec_criteria', 'authorization', 'implementation', 'history', 'delivery']) {
      expect(await errorsFor([file(ticket({ [field]: 1 }))])).toContain(`unknown fields ${field}`);
    }
    expect(await errorsFor([{ ...file(ticket()), file: '.sdd/beligent/tickets/archive/TICKET-001.md' }])).toContain('tickets are regular .md files directly in .sdd/beligent/tickets/');
    expect(await errorsFor([{ file: '.sdd/beligent/tickets/TICKET-002.markdown', text: 'x' }])).toContain('TICKET-002.markdown: tickets are regular .md files');
    expect(await errorsFor([{ file: '.sdd/beligent/specs/SPEC-001.md', text: 'x' }])).toContain('.sdd/beligent/specs/: epics and specs are no longer used');
  });

  it('reports a symlinked ticket instead of skipping it', async () => {
    const project = await writeProject([file(ticket())]);
    await symlink(path.join(project, '.sdd/beligent/tickets/TICKET-001.md'), path.join(project, '.sdd/beligent/tickets/TICKET-002.md'));
    expect((await validateProjectRecords(project, minimal)).join('\n')).toContain('TICKET-002.md: tickets are regular .md files');
  });

  it('validates dependencies and status reasons, and treats a removed dependency as satisfied', async () => {
    expect(await errorsFor([file(ticket({ depends_on: ['TICKET-001'] }))])).toContain('cannot depend on itself');
    expect(await errorsFor([file(ticket({ depends_on: ['TICKET-002'] })), file(ticket({ id: 'TICKET-002', depends_on: ['TICKET-001'] }))])).toContain('Dependency cycle');
    expect(await errorsFor([file(ticket({ depends_on: ['TICKET-404'] }))])).toBe('');
    expect(await errorsFor([file(ticket({ depends_on: ['EPIC-001'] }))])).toContain('depends_on must list ticket IDs');
    expect(await errorsFor([file(ticket({ status: 'blocked' }))])).toContain('blocked requires blocked_reason');
    expect(await errorsFor([file(ticket({ status: 'blocked', blocked_reason: 'Staging API is down' }))])).toBe('');
    expect(await errorsFor([file(ticket({ blocked_reason: 'stale' }))])).toContain('blocked_reason is only valid when status is blocked');
    expect(await errorsFor([file(ticket({ status: 'cancelled' }))])).toContain('cancelled requires cancelled_reason');
    expect(await errorsFor([file(ticket({ status: 'review' }))])).toContain('status must be one of');
  });

  it.each(['fail', 'blocked', 'not-run'])('keeps a ticket open while a check is %s', async (outcome) => {
    expect(await errorsFor([file(done({}, [passing({ outcome })]))])).toContain(`check 'regression' is ${outcome}; the ticket stays open`);
    expect(await errorsFor([file(done({ status: 'in-progress' }, [passing({ outcome })]))])).toBe('');
  });

  it('requires a passing check for every criterion before done', async () => {
    expect(await errorsFor([file(done(), body('AC-001', 'AC-002'))])).toContain('no passing check covers AC-002');
    expect(await errorsFor([file(done({ checks: undefined }))])).toContain('no passing check covers AC-001');
    expect(await errorsFor([file(done({}, [passing({ criteria: ['TICKET-001/AC-001'] })]))])).toContain("references TICKET-001/AC-001, which is not one of this ticket's criteria");
  });

  it('requires configured required checks to pass and record their configured command', async () => {
    const config: ProjectConfig = { ...minimal, checks: [{ id: 'unit', command: 'npm test', required: true }, { id: 'e2e', command: 'npm run e2e' }] };
    expect(await errorsFor([file(done())], config)).toContain("required project check 'unit' has no passing result");
    const unit = { id: 'unit', command: 'npm test', outcome: 'pass' };
    expect(await errorsFor([file(done({}, [passing(), unit]))], config)).toBe('');
    expect(await errorsFor([file(done({}, [passing(), { ...unit, command: 'true' }]))], config)).toContain("must record the configured command 'npm test'");
    expect(await errorsFor([file(done({}, [passing(), { ...unit, id: 'lint' }]))], config)).toContain("check 'lint' needs criteria or must match a configured check id");
  });

  it('records manual checks with what was observed', async () => {
    const manual = { id: 'ios-visual', criteria: ['AC-001'], procedure: 'Open /passport at 320px', observed: 'Label wraps', outcome: 'pass' };
    expect(await errorsFor([file(done({}, [manual]))])).toBe('');
    expect(await errorsFor([file(done({}, [{ ...manual, observed: undefined }]))])).toContain('is manual and needs observed');
    expect(await errorsFor([file(done({}, [{ ...manual, command: 'npm test' }]))])).toContain('exactly one of command or procedure');
  });

  it('rejects malformed and retired check fields', async () => {
    expect(await errorsFor([file(done({}, [passing(), passing()]))])).toContain('duplicate check ids');
    expect(await errorsFor([file(done({}, [passing({ outcome: 'not-applicable' })]))])).toContain('outcome must be pass, fail, blocked, not-run');
    expect(await errorsFor([file(done({}, [passing({ id: 'Bad id' })]))])).toContain('check id must be lowercase');
    for (const field of ['required', 'snapshot', 'revision', 'coverage', 'before', 'tests', 'at', 'by', 'carried_forward', 'reason']) {
      expect(await errorsFor([file(done({}, [passing({ [field]: 'x' })]))])).toContain(`has unknown fields ${field}`);
    }
  });
});

describe('ticket lifecycle with real checks', () => {
  const buggy = 'export const label = (value) => String(value ?? "").trim();\n';
  const fixed = 'export const label = (value) => String(value ?? "").trim() || "Passport";\n';
  const regression = 'import test from "node:test";\nimport assert from "node:assert/strict";\nimport { label } from "./app.mjs";\n\ntest("blank labels default to Passport", () => assert.equal(label("  "), "Passport"));\n';
  const command = 'node --test label.test.mjs';
  const config: ProjectConfig = { ...minimal, checks: [{ id: 'test', command, required: true }] };
  const run = (cwd: string) => spawnSync(process.execPath, ['--test', 'label.test.mjs'], { cwd, encoding: 'utf8' }).status === 0 ? 'pass' : 'fail';
  const record = (project: string, status: string, outcome: string) => writeFile(path.join(project, '.sdd/beligent/tickets/TICKET-001.md'), file(ticket({
    status, checks: [{ id: 'label-regression', criteria: ['AC-001'], command, outcome }, { id: 'test', command, outcome }],
  })).text);

  it('keeps a failed or unrun check open and closes once the regression passes', async () => {
    const project = await writeProject([file(ticket({ status: 'in-progress' }))], config);
    await writeFile(path.join(project, 'app.mjs'), buggy);
    await writeFile(path.join(project, 'label.test.mjs'), regression);
    expect(run(project)).toBe('fail');
    await record(project, 'done', 'fail');
    const failed = cli(['validate', project]);
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("check 'label-regression' is fail");
    await record(project, 'in-progress', 'fail');
    expect(cli(['validate', project]).status).toBe(0);
    await record(project, 'done', 'not-run');
    expect(cli(['validate', project]).stderr).toContain("check 'label-regression' is not-run");
    await writeFile(path.join(project, 'app.mjs'), fixed);
    expect(run(project)).toBe('pass');
    await record(project, 'done', 'pass');
    const closed = cli(['validate', project]);
    expect(closed.status, closed.stderr).toBe(0);
  });
});

describe('packaging inventory', () => {
  it('resolves to exactly the five canonical workflow skills and only the selected stack guides', async () => {
    expect([...skills]).toEqual(['sdd-init', 'sdd-define', 'sdd-implement', 'sdd-audit', 'sdd-deliver']);
    for (const { destination } of mappings()) expect(skills).toContain(destination.split('/')[1]);
    const files = (await planInstall(root, await tempdir(), { hosts: ['codex', 'claude-code'], stacks: ['python'] })).entries.map((entry) => entry.path);
    for (const skillRoot of ['.agents/skills', '.claude/skills']) {
      expect(files.filter((file) => file.startsWith(`${skillRoot}/`) && file.endsWith('/SKILL.md')).map((file) => file.split('/')[2]).sort()).toEqual([...skills].sort());
    }
    expect(files.filter((file) => file.startsWith('.sdd/beligent/guidance/')).map((file) => file.replace('.sdd/beligent/guidance/', '')).sort()).toEqual(['python.md']);
  });

  it('rejects an obsolete workflow skill, an entry point without the shared guidance and an auto-loading skill', async () => {
    const copy = await tempdir();
    await cp(root, copy, { recursive: true, filter: (source) => !/[/\\](?:node_modules|dist|\.git|temp change {2}md file)$/.test(source) });
    expect(await validateRepository(copy)).toEqual([]);
    await mkdir(path.join(copy, 'skills/develop-task'));
    await writeFile(path.join(copy, 'skills/develop-task/SKILL.md'), '---\nname: develop-task\ndescription: Obsolete.\n---\n');
    const entry = path.join(copy, 'skills/sdd-deliver/SKILL.md');
    await writeFile(entry, (await readFile(entry, 'utf8')).replace('[shared contract](references/shared/governance.md)', 'shared contract'));
    const define = path.join(copy, 'skills/sdd-define/SKILL.md');
    await writeFile(define, (await readFile(define, 'utf8')).replace('disable-model-invocation: true\n', ''));
    await rm(path.join(copy, 'skills/sdd-audit/agents/openai.yaml'));
    const setup = path.join(copy, 'skills/sdd-init/references/setup.md');
    await writeFile(setup, (await readFile(setup, 'utf8')).replace('| `cursor` |', '| cursor |'));
    const errors = (await validateRepository(copy)).join('\n');
    expect(errors).toContain('host table must list `cursor` with skill root `.agents/skills`');
    expect(errors).toContain('Expected five core skills; found develop-task');
    expect(errors).toContain('sdd-deliver: entrypoint must link the shared guidance');
    expect(errors).toContain('sdd-define: SKILL.md must set disable-model-invocation: true');
    expect(errors).toContain('sdd-audit: agents/openai.yaml is missing');
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

  it('keeps documented configuration examples valid', async () => {
    for (const doc of ['README.md']) {
      const blocks = [...(await readFile(path.join(root, doc), 'utf8')).matchAll(/```json\n([\s\S]*?)```/g)].map((match) => match[1]!);
      for (const block of blocks.filter((text) => text.includes('beligent-sdd/config'))) expect(validateConfig(parseConfig(block)), doc).toEqual([]);
    }
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
    expect(cli(['validate', '--since', 'main']).status).toBe(2);
    expect(cli(['snapshot']).status).toBe(2);
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

  it('validates a project and rejects invalid records, pre-1.0 locations and earlier schemas', async () => {
    const project = await writeProject([file(done())]);
    expect(cli(['validate', project]).status).toBe(0);
    expect(cli(['validate'], project).status).toBe(0);
    await writeProject([file(done({}, [passing({ outcome: 'fail' })]))], minimal, project);
    const failing = cli(['validate', project]);
    expect(failing.status).toBe(1);
    expect(failing.stderr).toContain('the ticket stays open');
    await writeFile(path.join(project, '.sdd/beligent/config.json'), JSON.stringify({ hosts: ['codex'] }));
    expect(cli(['validate', project]).stderr).toContain('predates Beligent SDD 1.0');
    const legacy = await tempdir();
    await mkdir(path.join(legacy, '.beligent'));
    await writeFile(path.join(legacy, '.beligent/config.json'), '{"schema_version":2}');
    const result = cli(['validate', legacy]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Pre-1.0 Beligent SDD setup found at .beligent/');
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

  it('doctor summarizes a valid config, installed skills, duplicates and pre-1.0 leftovers', async () => {
    const project = await writeProject([], { ...minimal, stacks: ['nodejs'] });
    for (const destination of ['.agents/skills/sdd-implement', '.claude/skills/sdd-implement', '.agents/skills/develop-task']) {
      await mkdir(path.join(project, destination), { recursive: true });
      await writeFile(path.join(project, destination, 'SKILL.md'), '---\nname: x\ndescription: x\n---\n');
    }
    await mkdir(path.join(project, '.beligent'));
    const result = cli(['doctor', project]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK configuration: hosts codex; stacks nodejs; checks none');
    expect(result.stderr).toContain('duplicate discovery risk: sdd-implement');
    expect(result.stderr).toContain('pre-1.0 skill .agents/skills/develop-task');
    expect(result.stderr).toContain('pre-1.0 .beligent/ directory found');
    expect(result.stderr).toContain('sdd-deliver');
  });
});

describe('host installation', () => {
  async function install(project: string, options: Parameters<typeof planInstall>[2] = {}) {
    const plan = await planInstall(root, project, options);
    return { plan, applied: await applyInstall(plan) };
  }
  async function snapshotTree(project: string): Promise<Map<string, { bytes: Buffer; mtime: bigint }>> {
    const result = new Map<string, { bytes: Buffer; mtime: bigint }>();
    const walk = async (relative: string): Promise<void> => {
      for (const entry of await readdir(path.join(project, relative), { withFileTypes: true })) {
        const child = path.join(relative, entry.name);
        if (entry.isDirectory()) await walk(child);
        else result.set(child, { bytes: await readFile(path.join(project, child)), mtime: (await stat(path.join(project, child), { bigint: true })).mtimeNs });
      }
    };
    await walk('');
    return result;
  }
  const sections = (text: string): number => text.split(START).length - 1;

  it.each(hostIds)('installs the five skills and the %s instruction files into a fresh project', async (host: HostId) => {
    const project = await tempdir();
    const { applied } = await install(project, { hosts: [host], stacks: ['python'] });
    expect(applied.error).toBeUndefined();
    const target = hostTargets[host];
    for (const skill of skills) {
      for (const document of await markdownFilesForTest(path.join(root, 'skills', skill))) {
        const relative = path.relative(path.join(root, 'skills', skill), document);
        expect(await readFile(path.join(project, target.skills, skill, relative))).toEqual(await readFile(document));
      }
    }
    for (const bridge of target.instructions) expect(sections(await readFile(path.join(project, bridge), 'utf8'))).toBe(1);
    for (const bridge of ['CLAUDE.md', '.github/copilot-instructions.md']) if (!(target.instructions as readonly string[]).includes(bridge)) expect(await fileExists(path.join(project, bridge))).toBe(false);
    for (const other of ['.agents/skills', '.claude/skills']) if (other !== target.skills) expect(await fileExists(path.join(project, other))).toBe(false);
    expect(await readFile(path.join(project, '.sdd/beligent/guidance/python.md'))).toEqual(await readFile(path.join(root, 'skills/sdd-implement/references/technology/python.md')));
    expect(await fileExists(path.join(project, '.sdd/beligent/guidance/engineering.md'))).toBe(false);
    expect(await fileExists(path.join(project, '.sdd/beligent/guidance/nextjs.md'))).toBe(false);
    const config = JSON.parse(await readFile(path.join(project, '.sdd/beligent/config.json'), 'utf8')) as ProjectConfig;
    expect(validateConfig(config)).toEqual([]);
    expect(config.hosts).toEqual([host]);
    for (const file of ['.sdd/beligent/setup-state.json', '.sdd/beligent/tickets']) expect(await fileExists(path.join(project, file))).toBe(false);
    for (const file of (await markdownFilesForTest(path.join(project, '.sdd/beligent/guidance')))) expect(await localLinkErrors(file, project)).toEqual([]);
    expect(cli(['doctor', project]).stdout).toContain('OK all five core skills are discoverable');
  });

  it('replaces edited and old managed content and preserves project-owned files and text outside the section', async () => {
    const project = await tempdir();
    await writeFile(path.join(project, 'AGENTS.md'), `# Team rules\n\n${START}\nOld Beligent text\n${END}\n\nKeep this footer.\n`);
    await install(project, { hosts: ['codex'], stacks: ['python'] });
    const skillFile = path.join(project, '.agents/skills/sdd-implement/SKILL.md');
    const engineering = path.join(project, '.sdd/beligent/guidance/python.md');
    await writeFile(skillFile, 'locally edited skill');
    await writeFile(engineering, 'locally edited guidance');
    await writeFile(path.join(project, '.agents/skills/sdd-implement/references/implementation.md'), 'file from an earlier package');
    await writeFile(path.join(project, '.sdd/beligent/guidance/engineering.md'), 'guidance from an earlier version');
    const owned = {
      '.sdd/beligent/config.json': `${JSON.stringify({ ...minimal, stacks: ['python'], checks: [{ id: 'unit', command: 'npm test', required: true }] }, null, 2)}\n`,
      '.sdd/beligent/tickets/TICKET-001.md': file(ticket()).text,
      '.sdd/beligent/guidance/local-api.md': '# Local API rules\n',
      '.agents/skills/team-helper/SKILL.md': '---\nname: team-helper\ndescription: Ours.\n---\n',
    };
    for (const [relative, text] of Object.entries(owned)) { await mkdir(path.dirname(path.join(project, relative)), { recursive: true }); await writeFile(path.join(project, relative), text); }
    const agents = await readFile(path.join(project, 'AGENTS.md'), 'utf8');
    await writeFile(path.join(project, 'AGENTS.md'), agents.replace('## Beligent SDD', '## Beligent SDD (edited)'));

    const { plan, applied } = await install(project, {});
    expect(applied.error).toBeUndefined();
    expect(plan.notes.join(' ')).toContain('still holds engineering.md from an earlier version');
    expect(await readFile(path.join(project, '.sdd/beligent/guidance/engineering.md'), 'utf8')).toBe('guidance from an earlier version');
    const actions = Object.fromEntries(plan.entries.map((entry) => [entry.path, entry.action]));
    expect(actions).toMatchObject({ '.agents/skills/sdd-implement/SKILL.md': 'replace', '.sdd/beligent/guidance/python.md': 'replace', '.agents/skills/sdd-implement/references/implementation.md': 'remove', 'AGENTS.md': 'replace-section', '.sdd/beligent/config.json': 'keep' });
    expect(await readFile(skillFile)).toEqual(await readFile(path.join(root, 'skills/sdd-implement/SKILL.md')));
    expect(await readFile(engineering)).toEqual(await readFile(path.join(root, 'skills/sdd-implement/references/technology/python.md')));
    expect(await fileExists(path.join(project, '.agents/skills/sdd-implement/references/implementation.md'))).toBe(false);
    for (const [relative, text] of Object.entries(owned)) expect(await readFile(path.join(project, relative), 'utf8')).toBe(text);
    const final = await readFile(path.join(project, 'AGENTS.md'), 'utf8');
    expect(final.startsWith('# Team rules\n\n')).toBe(true);
    expect(final.endsWith(`${END}\n\nKeep this footer.\n`)).toBe(true);
    expect(final).toContain((await readFile(path.join(root, 'skills/sdd-init/assets/AGENTS.fragment.md'), 'utf8')).trimEnd());
    expect(sections(final)).toBe(1);
  });

  it('recreates a missing managed file, repeats without writes and writes a shared root once', async () => {
    const project = await tempdir();
    await writeFile(path.join(project, 'AGENTS.md'), 'Handwritten instructions');
    const first = await install(project, { hosts: ['codex', 'github-copilot', 'cursor', 'github-copilot-cloud'] });
    expect(first.plan.entries.filter((entry) => entry.path.endsWith('/SKILL.md'))).toHaveLength(5);
    expect(first.plan.entries.filter((entry) => entry.path === 'AGENTS.md')).toHaveLength(1);
    expect(await readFile(path.join(project, 'AGENTS.md'), 'utf8')).toMatch(/^Handwritten instructions\n\n<!-- beligent-sdd:start -->/);
    await rm(path.join(project, '.agents/skills/sdd-audit/references/review.md'));
    const repaired = await install(project, {});
    expect(pending(repaired.plan).map((entry) => `${entry.action} ${entry.path}`)).toEqual(['create .agents/skills/sdd-audit/references/review.md']);
    const before = await snapshotTree(project);
    const repeat = await install(project, {});
    expect(pending(repeat.plan)).toEqual([]);
    expect(repeat.applied.written).toEqual([]);
    expect(await snapshotTree(project)).toEqual(before);
    expect(sections(await readFile(path.join(project, 'AGENTS.md'), 'utf8'))).toBe(1);
    expect(sections(await readFile(path.join(project, '.github/copilot-instructions.md'), 'utf8'))).toBe(1);
  });

  it('reports malformed markers and unsupported old configuration without writing anything', async () => {
    const malformed = await tempdir();
    const handwritten = `# Rules\n${START}\none\n${END}\n${START}\ntwo\n${END}\n`;
    await writeFile(path.join(malformed, 'AGENTS.md'), handwritten);
    const plan = await planInstall(root, malformed, { hosts: ['codex'] });
    expect(conflicts(plan).map((entry) => entry.path)).toEqual(['AGENTS.md']);
    expect(conflicts(plan)[0]!.reason).toContain('found 2 start and 2 end Beligent SDD markers');
    expect((await applyInstall(plan)).written).toEqual([]);
    const refused = cli(['install', malformed, '--host', 'codex', '--apply']);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('Nothing was written');
    expect(await readdir(malformed)).toEqual(['AGENTS.md']);
    expect(await readFile(path.join(malformed, 'AGENTS.md'), 'utf8')).toBe(handwritten);

    const old = await tempdir();
    await mkdir(path.join(old, '.sdd/beligent'), { recursive: true });
    await writeFile(path.join(old, '.sdd/beligent/config.json'), '{"schema_version": 1, "assistants": ["codex"]}\n');
    await mkdir(path.join(old, '.beligent'));
    await writeFile(path.join(old, '.beligent/config.json'), '{}');
    const blocked = cli(['install', old, '--host', 'codex', '--apply']);
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toContain('BLOCKED .sdd/beligent/config.json cannot be used');
    expect(blocked.stderr).toContain('earlier Beligent SDD schema');
    expect(blocked.stderr).toContain('Pre-1.0 .beligent/config.json found');
    expect((await readdir(old)).sort()).toEqual(['.beligent', '.sdd']);
    expect(await readdir(path.join(old, '.sdd/beligent'))).toEqual(['config.json']);

    for (const lines of [`${START}\nunterminated\n`, `${END}\n${START}\n`, `text ${START}\n${END}\n`]) expect(mergeSection(lines, `${START}\nnew\n${END}\n`)).toHaveProperty('conflict');
    expect(mergeSection(`a\r\n${START}\r\nold\r\n${END}\r\nb\r\n`, `${START}\nnew\n${END}\n`)).toEqual({ action: 'replace-section', text: `a\r\n${START}\nnew\n${END}\r\nb\r\n` });
  });

  it('treats an unreadable or non-file instruction path as a conflict and writes nothing', async () => {
    const cases: Array<[HostId, (project: string) => Promise<void>, string]> = [
      ['codex', (project) => mkdir(path.join(project, 'AGENTS.md')), 'AGENTS.md'],
      ['github-copilot', (project) => writeFile(path.join(project, '.github'), 'not a directory'), '.github/copilot-instructions.md'],
      ['codex', async (project) => { await writeFile(path.join(project, 'AGENTS.md'), 'secret'); await chmod(path.join(project, 'AGENTS.md'), 0o000); }, 'AGENTS.md'],
    ];
    for (const [host, prepare, conflicted] of cases) {
      const project = await tempdir();
      await prepare(project);
      const before = (await readdir(project)).sort();
      const plan = await planInstall(root, project, { hosts: [host] });
      expect(conflicts(plan).map((entry) => entry.path)).toEqual([conflicted]);
      expect(await applyInstall(plan)).toEqual({ written: [], error: 'The plan has blockers or conflicts; nothing was written.' });
      expect((await readdir(project)).sort()).toEqual(before);
      await chmod(path.join(project, conflicted.split('/')[0]!), 0o755).catch(() => undefined);
    }
  });

  it.each(['directory', 'unreadable', 'symlink'] as const)('does not bypass an invalid root CLAUDE.md (%s) for nested guidance', async (kind) => {
    const project = await tempdir();
    const rootInstructions = path.join(project, 'CLAUDE.md');
    const nestedInstructions = path.join(project, '.claude/CLAUDE.md');
    await mkdir(path.dirname(nestedInstructions));
    await writeFile(nestedInstructions, '# Keep nested Claude rules\n');
    if (kind === 'directory') await mkdir(rootInstructions);
    else if (kind === 'unreadable') {
      await writeFile(rootInstructions, '# Unreadable root rules\n');
      await chmod(rootInstructions, 0o000);
    } else {
      const elsewhere = path.join(await tempdir(), 'CLAUDE.md');
      await writeFile(elsewhere, '# Linked root rules\n');
      await symlink(elsewhere, rootInstructions);
    }
    const before = (await readdir(project)).sort();
    const nestedTime = (await stat(nestedInstructions, { bigint: true })).mtimeNs;
    try {
      const plan = await planInstall(root, project, { hosts: ['claude-code'] });
      expect(conflicts(plan).map((entry) => entry.path)).toEqual(['CLAUDE.md']);
      expect(plan.entries.some((entry) => entry.path === '.claude/CLAUDE.md')).toBe(false);
      expect(await applyInstall(plan)).toEqual({ written: [], error: 'The plan has blockers or conflicts; nothing was written.' });
      const applied = cli(['install', project, '--host', 'claude-code', '--apply']);
      expect(applied.status).toBe(1);
      expect(applied.stderr).toContain('Nothing was written');
      expect((await readdir(project)).sort()).toEqual(before);
      expect(await readFile(nestedInstructions, 'utf8')).toBe('# Keep nested Claude rules\n');
      expect((await stat(nestedInstructions, { bigint: true })).mtimeNs).toBe(nestedTime);
    } finally {
      if (kind === 'unreadable') await chmod(rootInstructions, 0o600);
    }
  });

  it('ignores an existing setup-state file and refuses linked destinations', async () => {
    const project = await tempdir();
    await mkdir(path.join(project, '.sdd/beligent'), { recursive: true });
    await writeFile(path.join(project, '.sdd/beligent/setup-state.json'), 'not even JSON');
    const { plan, applied } = await install(project, { hosts: ['claude-code'] });
    expect(applied.error).toBeUndefined();
    expect(plan.notes.join(' ')).toContain('setup-state.json is no longer used');
    expect(plan.entries.some((entry) => entry.path.endsWith('setup-state.json'))).toBe(false);
    expect(await readFile(path.join(project, '.sdd/beligent/setup-state.json'), 'utf8')).toBe('not even JSON');

    const nested = await tempdir();
    await mkdir(path.join(nested, '.claude'));
    await writeFile(path.join(nested, '.claude/CLAUDE.md'), 'Nested Claude rules\n');
    await install(nested, { hosts: ['claude-code'] });
    expect(await fileExists(path.join(nested, 'CLAUDE.md'))).toBe(false);
    expect(await readFile(path.join(nested, '.claude/CLAUDE.md'), 'utf8')).toContain('@../AGENTS.md');

    const linked = await tempdir();
    const elsewhere = await tempdir();
    await symlink(elsewhere, path.join(linked, '.agents'));
    const unsafe = await planInstall(root, linked, { hosts: ['codex'] });
    expect(conflicts(unsafe).some((entry) => entry.path.startsWith('.agents/skills/') && entry.reason!.includes('symlink'))).toBe(true);
    expect((await applyInstall(unsafe)).written).toEqual([]);
    expect(await readdir(elsewhere)).toEqual([]);
  });

  it('requires a supported host, ignores other hosts and rejects unknown stacks', async () => {
    const project = await tempdir();
    expect((await planInstall(root, project)).blockers.join(' ')).toContain('Select at least one supported --host');
    const ignored = await planInstall(root, project, { hosts: ['codex', 'windsurf'] });
    expect(ignored.blockers).toEqual([]);
    expect(ignored.hosts).toEqual(['codex']);
    expect(ignored.notes.join(' ')).toContain('Ignoring windsurf: not a supported host');
    expect((await planInstall(root, project, { hosts: ['windsurf'] })).blockers.join(' ')).toContain('Select at least one supported --host');
    expect((await planInstall(root, project, { hosts: ['codex'], stacks: ['rails'] })).blockers.join(' ')).toContain('Unsupported stack rails');
    const dry = cli(['install', project, '--host', 'codex']);
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain('dry run');
    expect(dry.stdout).toContain('Policy: An explicit install replaces');
    const copilot = cli(['install', project, '--host', 'github-copilot']).stdout;
    expect(copilot).toContain('VS Code: type `/` in chat');
    expect(copilot).toContain('Copilot CLI: run `/skills list`, then start the prompt with `/sdd-implement TICKET-042`.');
    expect(await readdir(project)).toEqual([]);
  });
});

describe('workflow fixture', () => {
  const example = path.join(root, 'examples/workflow-fixture');

  it('validates the sample tickets and runs the walkthrough against the real CLI', async () => {
    expect(await validateProjectRecords(example, minimal)).toEqual([]);
    const { records: parsed } = parseRecords((await readRecordFiles(example)).files);
    expect(parsed.map((record) => `${record.id}:${String(record.data.status)}`).sort()).toEqual(['TICKET-001:done', 'TICKET-002:done', 'TICKET-003:done', 'TICKET-004:in-progress']);
    const before = (await readRecordFiles(example)).files;
    const run = spawnSync(process.execPath, ['walkthrough.mjs'], { cwd: example, encoding: 'utf8', env: { ...process.env, BELIGENT_SDD_CLI: JSON.stringify(['--import', tsx, path.join(root, 'src/cli/index.ts')]) } });
    expect(run.status, run.stdout + run.stderr).toBe(0);
    for (const line of ['no ticket exists', 'a ticket without requirements or criterion text is rejected', "done is rejected: check 'blank-title' is fail", 'TICKET-002 still validates', 'the next ID is TICKET-003', 'the code change stays', 'All walkthrough checks passed.']) expect(run.stdout).toContain(line);
    expect((await readRecordFiles(example)).files).toEqual(before);
    expect(spawnSync(process.execPath, ['--test', 'regression.test.mjs'], { cwd: example }).status).toBe(0);
  });

  it('rejects the invalid closure case and accepts a removed dependency', async () => {
    const project = await tempdir();
    await cp(example, project, { recursive: true });
    await cp(path.join(example, 'cases/invalid-done.md'), path.join(project, '.sdd/beligent/tickets/TICKET-999.md'));
    expect((await validateProjectRecords(project, minimal)).join(' ')).toContain("TICKET-999: check 'label-regression' is fail");
    await rm(path.join(project, '.sdd/beligent/tickets/TICKET-999.md'));
    await rm(path.join(project, '.sdd/beligent/tickets/TICKET-002.md'));
    expect(await validateProjectRecords(project, minimal)).toEqual([]);
  });
});
