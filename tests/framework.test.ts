import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir, symlink, link, cp, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { parseConfig, previewConfigMigration, validateConfig, type ProjectConfig, type Schema1ProjectConfig, type Schema2ProjectConfig } from '../src/validation/config.js';
import { localLinkErrors, parseFrontmatter, validateProjectRecords, validateRepository } from '../src/validation/repository.js';
import { mappings, skills, syncAssets } from '../src/packaging/sync-assets.js';
import { createUsageRecord, formatUsageFooter, parseAgentUsage, summarizeUsage } from '../src/usage/usage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary: string[] = [];

async function tempdir(): Promise<string> {
  const result = await mkdtemp(path.join(os.tmpdir(), 'beligent-ts-test-'));
  temporary.push(result);
  return result;
}
afterEach(async () => { await Promise.all(temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

async function templateConfig(): Promise<Schema2ProjectConfig> {
  const text = await readFile(path.join(root, 'skills/init-project/assets/config.json'), 'utf8');
  const config = JSON.parse(text) as Schema2ProjectConfig;
  config.project = { name: 'Fixture project', type: 'existing application' };
  return config;
}

async function schema1Config(): Promise<Schema1ProjectConfig> {
  const config = structuredClone(await templateConfig()) as Record<string, unknown>;
  delete config.workflow;
  delete config.testing;
  delete config.git;
  return { ...config, schema_version: 1 } as Schema1ProjectConfig;
}

async function writeArtifact(file: string, metadata: Record<string, unknown>, body: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `---\n${stringify(metadata)}---\n${body}`, 'utf8');
}

describe('consumer configuration validation', () => {
  it('accepts valid schema 1 config and the schema 2 project template', async () => {
    expect(validateConfig(await schema1Config())).toEqual([]);
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
    const errors = validateConfig({ ...config, schema_version: 3 });
    expect(errors[0]?.message).toContain('separate migration');
    expect(config).toEqual(before);
    for (const schemaVersion of [true, false, 0, 3, null, '1']) {
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
    const config = await schema1Config();
    expect(config.schema_version).toBe(1);
    expect(config.profile).toBe('standard');
    expect(config.profiles.standard).toEqual({
      artifacts: ['overview', 'requirements', 'specification', 'plan', 'ticket'],
      approvals: ['scope', 'implementation', 'completion'],
    });
    expect(validateConfig({ ...config, workflow: { rigor: 'standard' } }).length).toBeGreaterThan(0);
  });

  it.each(['light', 'standard', 'rigorous'] as const)('accepts schema 2 rigor %s independently of design depth', async (rigor) => {
    const config = await templateConfig();
    config.workflow.rigor = rigor;
    expect(validateConfig(config)).toEqual([]);
  });

  it.each(['current-task', 'near-term', 'comprehensive'] as const)('accepts schema 2 design depth %s independently of rigor', async (designDepth) => {
    const config = await templateConfig();
    config.workflow.design_depth = designDepth;
    expect(validateConfig(config)).toEqual([]);
  });

  it('rejects invalid schema 2 policy values and unknown configuration keys', async () => {
    const config = await templateConfig();
    expect(validateConfig({ ...config, workflow: { ...config.workflow, rigor: 'casual' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, workflow: { ...config.workflow, design_depth: 'forever' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, workflow: { ...config.workflow, extra: true } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, testing: { ...config.testing, unit: 'sometimes' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, git: { ...config.git, push_after_commit: 'maybe' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, git: { ...config.git, extra: true } }).length).toBeGreaterThan(0);
    expect(validateConfig({ ...config, unexpected: true }).length).toBeGreaterThan(0);
  });

  it('uses the recommended schema 2 workflow, testing, and delivery defaults', async () => {
    const config = await templateConfig();
    expect(config.workflow).toEqual({ rigor: 'standard', design_depth: 'current-task', ask_before_expansion: true });
    expect(config.testing).toMatchObject({ lint: 'always', typecheck: 'always', unit: 'when-relevant', e2e: 'critical-user-journeys', accessibility: 'affected-ui', security: 'risk-based' });
    expect(config.git).toMatchObject({ strategy: 'feature-branches', conventional_commits: true, push_after_commit: 'ask', pull_request: 'feature-complete', task_complete_at: 'merged-pr' });
    expect(validateConfig(config)).toEqual([]);
  });

  it('rejects duplicate keys at any JSON depth and invalid JSON constants', () => {
    expect(() => parseConfig('{"a":1,"a":2}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"a":{"b":1,"b":2}}')).toThrow('Duplicate JSON key');
    expect(() => parseConfig('{"x":NaN}')).toThrow();
    expect(() => parseConfig('{"schema_version":1.0}')).toThrow('JSON integer 1');
    expect(() => parseConfig('{"schema_version":2.0}')).toThrow('JSON integer 2');
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

  it('previews an idempotent schema 1 migration without changing legacy paths or provider settings', async () => {
    const config = await schema1Config();
    config.profile = 'lightweight';
    config.artifacts.overview = 'handbook/context.md';
    config.tickets.paths = { epics: 'planning/epics', tickets: 'planning/tickets' };
    const preview = previewConfigMigration(config);
    expect(preview.changed).toBe(true);
    expect(preview.workflow_mapping).toBe('lightweight-to-light');
    expect(preview.config.workflow).toEqual({ rigor: 'light', design_depth: 'current-task', ask_before_expansion: true });
    expect(preview.config.artifacts).toEqual(config.artifacts);
    expect(preview.config.tickets).toEqual(config.tickets);
    const repeated = previewConfigMigration(preview.config);
    expect(repeated.changed).toBe(false);
    expect(repeated.workflow_mapping).toBe('already-schema-2');
    expect(repeated.config).toEqual(preview.config);
  });

  it('maps schema 1 standard conservatively and permits explicit adoption of the new standard policy', async () => {
    const config = await schema1Config();
    const compatible = previewConfigMigration(config);
    expect(compatible.workflow_mapping).toBe('standard-to-rigorous');
    expect(compatible.config.workflow.rigor).toBe('rigorous');
    expect(compatible.config.profile).toBe('standard');
    expect(compatible.config.profiles).toEqual(config.profiles);
    const recommended = previewConfigMigration(config, true);
    expect(recommended.workflow_mapping).toBe('explicit-standard');
    expect(recommended.config.workflow.rigor).toBe('standard');
    expect(recommended.config.workflow.design_depth).toBe('current-task');
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
  it('validates the checked-in nine-skill repository and worked example', async () => {
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
      'When `ask_before_expansion` is true',
      'compact task is sufficient',
    ]) expect(normalizedGovernance).toContain(principle);

    for (const mapping of mappings().filter((entry) => entry.source === source)) {
      expect(await readFile(path.join(root, mapping.destination), 'utf8')).toBe(governance);
    }
  });

  it('packages one current-task lifecycle contract and keeps public skill routing bounded', async () => {
    const source = 'skills/define-work/references/shared/current-task-lifecycle.md';
    const lifecycle = await readFile(path.join(root, source), 'utf8');
    const lifecycleMappings = mappings().filter((entry) => entry.source === source);
    expect(lifecycleMappings.map((entry) => entry.destination).sort()).toEqual([
      'skills/develop-task/references/shared/current-task-lifecycle.md',
      'skills/implement-ticket/references/shared/current-task-lifecycle.md',
      'skills/plan-work/references/shared/current-task-lifecycle.md',
      'skills/verify-work/references/shared/current-task-lifecycle.md',
    ]);
    for (const mapping of lifecycleMappings) expect(await readFile(path.join(root, mapping.destination), 'utf8')).toBe(lifecycle);

    const define = await readFile(path.join(root, 'skills/define-work/SKILL.md'), 'utf8');
    const plan = await readFile(path.join(root, 'skills/plan-work/SKILL.md'), 'utf8');
    const implement = await readFile(path.join(root, 'skills/implement-ticket/SKILL.md'), 'utf8');
    const verify = await readFile(path.join(root, 'skills/verify-work/SKILL.md'), 'utf8');
    const init = await readFile(path.join(root, 'skills/init-project/SKILL.md'), 'utf8');
    const adopt = await readFile(path.join(root, 'skills/adopt-project/SKILL.md'), 'utf8');
    const normalized = [lifecycle, define, plan, implement, verify, init, adopt].map((text) => text.replace(/\s+/g, ' '));
    expect(normalized[0]).toContain('schema 1 retains its profile-based workflow and artifacts');
    expect(normalized[0]).toContain('Reference that context from the task instead of copying');
    expect(normalized[1]).toContain('ordinary schema-2 feature request');
    expect(normalized[1]).toContain('do not infer project planning, a complete backlog, or comprehensive design');
    expect(normalized[2]).toContain('`plan-task` | Default');
    expect(normalized[2]).toContain('`plan-project` | Explicit project planning intent');
    expect(normalized[2]).toContain('no separate PLAN is useful');
    expect(normalized[3]).toContain('do not regenerate specifications');
    expect(normalized[0]).toContain('feature-drift, future-candidate, decision-significance, and depth-expansion rules');
    expect(normalized[3]).toContain("shared lifecycle's feature-drift, future-candidate");
    expect(normalized[4]).toContain("project's `testing` preferences");
    expect(normalized[4]).toContain('An available category is not mandatory');
    expect(normalized[4]).toContain('without rewriting them');
    expect(normalized[5]).toContain('one concise batch of workflow, testing, and delivery defaults');
    expect(normalized[6]).toContain('preferences already present in a valid configuration');
  });

  it('discovers develop-task and preserves its deterministic orchestration decisions', async () => {
    expect(skills).toEqual(['init-project', 'adopt-project', 'define-work', 'plan-work', 'implement-ticket', 'verify-work', 'develop-task', 'diagnose', 'deliver-work']);
    const entrypoint = await readFile(path.join(root, 'skills/develop-task/SKILL.md'), 'utf8');
    const parsed = parseFrontmatter(entrypoint);
    expect(parsed.data.name).toBe('develop-task');
    const decisions = new Map([...parsed.body.matchAll(/^\| ([^|]+?) \| ([^|]+?) \|$/gm)].map((match) => [match[1], match[2]]));
    expect(decisions.get('Ready compact task')).toContain('Skip definition and planning; implement');
    expect(decisions.get('Ready expanded task with applicable PLAN')).toContain('Reuse its REQ/SPEC/PLAN; implement');
    expect(decisions.get('Small blocking gap')).toContain('clarification');
    expect(decisions.get('Stop rule met and implementation is obvious')).toContain('Skip PLAN');
    expect(decisions.get('Coordinated steps, cross-component change, sequencing, material risk, rollback, non-obvious tradeoff, or rigorous requirement')).toContain('Use `plan-task`');
    expect(decisions.get('Consequential expansion beyond selected depth')).toContain('ask before broader design');
    expect(decisions.get('Manual observation needed after automated checks')).toContain('manual-validation checklist');
    expect(decisions.get('Two ineffective symptom-level fixes do not resolve the same behavior')).toContain('diagnosis-required');
    expect(decisions.get('Verification complete')).toContain('ready-for-delivery');
    const normalized = parsed.body.replace(/\s+/g, ' ');
    expect(normalized).toContain('Never infer `plan-epic` or `plan-project`');
    expect(normalized).toContain('Select checks from project `testing` policy and changed risk');
    expect(normalized).toContain('Run categories configured as `always`');
    expect(normalized).toContain('apply conditional categories only when their condition is relevant');
    expect(normalized).toContain('Do not add unrelated test infrastructure');
    expect(normalized).toContain('Do not create follow-up tickets unless explicitly requested');
    expect(normalized).toContain('Do not commit, push, create or merge a pull request');
    expect(normalized).toContain('Schema 1 retains its existing profile artifacts, readiness, and approval gates');
  });

  it('discovers diagnose and applies one canonical deterministic safeguard contract', async () => {
    const source = 'skills/diagnose/references/shared/diagnosis-and-simplicity.md';
    const contract = await readFile(path.join(root, source), 'utf8');
    const contractMappings = mappings().filter((entry) => entry.source === source);
    expect(contractMappings.map((entry) => entry.destination).sort()).toEqual([
      'skills/define-work/references/shared/diagnosis-and-simplicity.md',
      'skills/develop-task/references/shared/diagnosis-and-simplicity.md',
      'skills/implement-ticket/references/shared/diagnosis-and-simplicity.md',
      'skills/plan-work/references/shared/diagnosis-and-simplicity.md',
      'skills/verify-work/references/shared/diagnosis-and-simplicity.md',
    ]);
    for (const mapping of contractMappings) expect(await readFile(path.join(root, mapping.destination), 'utf8')).toBe(contract);

    const entrypoint = parseFrontmatter(await readFile(path.join(root, 'skills/diagnose/SKILL.md'), 'utf8'));
    expect(entrypoint.data.name).toBe('diagnose');
    const fixActions = new Map([...contract.matchAll(/^\| ([^|]+?) \| ([^|]+?) \|$/gm)].map((match) => [match[1], match[2]]));
    expect(fixActions.get('0 or 1')).toContain('correction and reverification remain allowed');
    expect(fixActions.get('2 or more')).toContain('`diagnosis-required`');
    for (const state of [
      '`implementation-failure`', '`test-failure`', '`acceptance-criterion-failure`', '`manual-validation-failure`',
      '`diagnosis-required`', '`specification-contradiction`', '`scope-expansion-required`', '`unrelated-discovery`',
    ]) expect(fixActions.has(state)).toBe(true);

    const normalizedContract = contract.replace(/\s+/g, ' ');
    const normalizedSkill = entrypoint.body.replace(/\s+/g, ' ');
    expect(normalizedSkill).toContain('is not required');
    expect(normalizedSkill).toContain('without forcing new SDD artifacts');
    expect(normalizedContract).toContain('new project-planning artifacts');
    expect(normalizedSkill).toContain('Separate observations from hypotheses');
    expect(normalizedSkill).toContain('do not change product behavior or perform unrelated cleanup');
    expect(normalizedContract).toContain('ask before creating broader specification or design');
    expect(normalizedContract).toContain('materially simpler implementation');
    expect(normalizedContract).toContain('speculative abstractions or infrastructure');
    expect(normalizedContract).toContain('Directly necessary support code is not feature drift');
    expect(normalizedContract).toContain('Significant unapproved drift pauses or fails the current task');
    expect(normalizedContract).toContain('unrelated discovery remains a concise future candidate');
    expect(normalizedContract).toContain('Process overhead appears disproportionate to the current task');
    expect(normalizedContract).toContain('Do not delete, compact, rewrite, or bypass required artifacts');
  });

  it('discovers deliver-work and applies deterministic delivery policy without real remotes', async () => {
    const entrypoint = parseFrontmatter(await readFile(path.join(root, 'skills/deliver-work/SKILL.md'), 'utf8'));
    const contract = await readFile(path.join(root, 'skills/deliver-work/references/delivery.md'), 'utf8');
    expect(entrypoint.data.name).toBe('deliver-work');
    expect(mappings().some((entry) => entry.destination === 'skills/deliver-work/references/ticket-management/contract.md')).toBe(true);

    const rows = [...contract.matchAll(/^\| ([^|]+?) \| ([^|]+?) \|(?: ([^|]+?) \|)?$/gm)].map((match) => [match[1], match[2], match[3]]);
    const state = (name: string) => rows.find((row) => row[0] === name)?.[1];
    const policy = (setting: string, value: string) => rows.find((row) => row[0] === setting && row[1] === value)?.[2];
    expect(state('`ready-for-delivery`')).toContain('passed preflight');
    expect(state('`blocked`')).toContain('prerequisite');
    expect(state('`commit`')).toContain('commit exists locally');
    expect(state('`merged-pr`')).toContain('merge was observed');
    expect(policy('`conventional_commits`', '`true`')).toContain('conventional commit');
    expect(policy('`agent_may_commit`', '`false`')).toContain('must not commit');
    expect(policy('`agent_may_commit`', '`true`')).toContain('may commit only after preflight');
    expect(policy('`push_after_commit`', '`ask`')).toContain('Stop at `committed` and ask');
    expect(policy('`push_after_commit`', '`always`')).toContain('Push after commit');
    expect(policy('`pull_request`', '`always`')).toContain('Create a PR');
    expect(policy('`pull_request`', '`never`')).toContain('Do not create a PR');

    const normalizedContract = contract.replace(/\s+/g, ' ');
    const normalizedSkill = entrypoint.body.replace(/\s+/g, ' ');
    expect(normalizedContract).toContain('Surface unrelated modifications and exclude them');
    expect(normalizedContract).toContain('Never force push by default');
    expect(normalizedContract).toContain('briefly states implemented behavior, criterion references, meaningful automated results');
    expect(normalizedContract).toContain('Never merge solely because the PR exists or checks pass');
    expect(normalizedContract).toContain('Schema-1 projects have no framework Git policy');
    expect(normalizedSkill).toContain('Direct invocation does not require prior use of `develop-task`');
    expect(normalizedSkill).toContain('Do not implement, refactor, respecify, diagnose');
    expect(normalizedSkill).toContain('or select the next task');
    const develop = (await readFile(path.join(root, 'skills/develop-task/SKILL.md'), 'utf8')).replace(/\s+/g, ' ');
    expect(develop).toContain('Do not commit, push, create or merge a pull request');
    expect(develop).toContain('independently invoked `deliver-work` skill');
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
    const config = await schema1Config();
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
    const config = await schema1Config();
    config.profile = 'lightweight';
    await writeArtifact(path.join(project, config.tickets.paths.tickets, 'TICKET-001.md'), {
      id: 'TICKET-001', kind: 'ticket', title: 'Small isolated change', status: 'todo', readiness: 'ready', priority: 'low',
      requirements: [], specifications: [], acceptance_criteria: ['TICKET-001/AC-001'], dependencies: [], approval_refs: [], evidence: [],
    }, '# Small isolated change\n\n## Acceptance criteria\n\n### AC-001\n\nThe change has an observable result.\n');
    expect(await validateProjectRecords(project, config)).toEqual([]);
  });

  it('accepts a schema 2 standard compact task when the stop rule is met', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    await writeArtifact(path.join(project, config.tickets.paths.tickets, 'TICKET-012.md'), {
      id: 'TICKET-012', status: 'todo', rigor: 'standard', design_depth: 'current-task',
    }, '# Contact page\n\n## Objective\n\nLet customers contact the team.\n\n## Behavior\n\nExpose a public contact route.\n\n## Acceptance criteria\n\n### AC-001\n\nThe route is reachable from navigation.\n\n## Verification\n\n- Run the relevant UI checks.\n');
    expect(await validateProjectRecords(project, config)).toEqual([]);
  });

  it('keeps schema 2 compact blockers preliminary and rejects them as ready', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    const file = path.join(project, config.tickets.paths.tickets, 'TICKET-012.md');
    const metadata = { id: 'TICKET-012', status: 'todo', rigor: 'standard', design_depth: 'current-task', readiness: 'ready' };
    const body = '# Contact page\n\n## Objective\n\nLet customers contact the team.\n\n## Behavior\n\nExpose a public contact route.\n\n## Acceptance criteria\n\n### AC-001\n\nThe route is reachable.\n\n## Blocking questions\n\nWhich contact provider is approved?\n';
    await writeArtifact(file, metadata, body);
    expect((await validateProjectRecords(project, config)).some((error) => error.includes('unresolved blocking questions'))).toBe(true);
    await writeArtifact(file, { ...metadata, readiness: 'preliminary' }, body);
    expect(await validateProjectRecords(project, config)).toEqual([]);
  });

  it('preserves schema 1 compact-task rejection and requires expanded artifacts for schema 2 rigorous work', async () => {
    const project = await tempdir();
    const body = '# Contact page\n\n## Objective\n\nLet customers contact the team.\n\n## Behavior\n\nExpose a public contact route.\n\n## Acceptance criteria\n\n### AC-001\n\nThe route is reachable.\n';
    const metadata = { id: 'TICKET-012', status: 'todo', rigor: 'standard', design_depth: 'current-task' };
    const schema1 = await schema1Config();
    await writeArtifact(path.join(project, schema1.tickets.paths.tickets, 'TICKET-012.md'), metadata, body);
    expect((await validateProjectRecords(project, schema1)).some((error) => error.includes('normalized ticket contract'))).toBe(true);
    const schema2 = await templateConfig();
    schema2.workflow.rigor = 'rigorous';
    await writeArtifact(path.join(project, schema2.tickets.paths.tickets, 'TICKET-012.md'), { ...metadata, rigor: 'rigorous' }, body);
    expect((await validateProjectRecords(project, schema2)).some((error) => error.includes('requires expanded artifacts'))).toBe(true);
  });

  it('lets schema 2 standard expanded tickets use local criteria without separate requirement or specification links', async () => {
    const project = await tempdir();
    const config = await templateConfig();
    await writeArtifact(path.join(project, config.tickets.paths.tickets, 'TICKET-001.md'), {
      id: 'TICKET-001', kind: 'ticket', title: 'Small change', status: 'todo', readiness: 'ready', priority: 'medium',
      requirements: [], specifications: [], acceptance_criteria: ['TICKET-001/AC-001'], dependencies: [], approval_refs: [], evidence: [],
    }, '# Small change\n\n## Acceptance criteria\n\n### AC-001\n\nThe change has an observable result.\n');
    expect(await validateProjectRecords(project, config)).toEqual([]);
  });

  it('keeps existing expanded schema 2 work usable', async () => {
    const project = path.join(await tempdir(), 'expanded-schema-2');
    await cp(path.join(root, 'examples/team-task-tracker'), project, { recursive: true });
    const config = await templateConfig();
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify(config, null, 2));
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

describe('skill usage accounting', () => {
  it('normalizes Codex totals and aggregates records without source content', () => {
    const source = '{"type":"turn.completed","usage":{"input_tokens":100,"input_tokens_details":{"cached_tokens":40},"output_tokens":25,"output_tokens_details":{"reasoning_tokens":5},"total_tokens":125},"secret":"do not retain"}\n';
    expect(parseAgentUsage('codex', source)).toMatchObject({ input_tokens: 100, cached_input_tokens: 40, output_tokens: 25, reasoning_tokens: 5, total_tokens: 125 });
    const item = createUsageRecord('codex', 'define-work', 'TICKET-1', source, '2026-10-22T00:00:00.000Z');
    expect(JSON.stringify(item)).not.toContain('do not retain');
    expect(formatUsageFooter(item)).toBe('Token usage — define-work (codex): 125 total | 100 input | 40 cached input | 0 cache write | 25 output | 5 reasoning');
    expect(summarizeUsage([item, { ...item, id: 'another' }])).toMatchObject([{ skill: 'define-work', runs: 2, total_tokens: 250 }]);
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
    expect(version.stdout.trim()).toBe('0.2.0');
    expect(run(['unknown']).status).toBe(2);
    expect(run(['validate', '--unknown']).status).toBe(2);
  });

  it('keeps the npm package version and VERSION file in sync', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { version: string };
    expect((await readFile(path.join(root, 'VERSION'), 'utf8')).trim()).toBe(pkg.version);
  });

  it('imports Codex and Claude token usage and reports totals by skill without retaining prompts', async () => {
    const project = await tempdir();
    const codex = path.join(project, 'codex.jsonl');
    const claude = path.join(project, 'claude.jsonl');
    const store = path.join(project, '.beligent/usage.jsonl');
    await writeFile(codex, '{"type":"item.completed","text":"private prompt"}\n{"type":"turn.completed","usage":{"input_tokens":100,"input_tokens_details":{"cached_tokens":40},"output_tokens":25,"output_tokens_details":{"reasoning_tokens":5},"total_tokens":125}}\n');
    await writeFile(claude, '{"type":"assistant","message":{"usage":{"input_tokens":30,"cache_read_input_tokens":10,"cache_creation_input_tokens":4,"output_tokens":8}}}\n{"type":"assistant","message":{"usage":{"input_tokens":20,"output_tokens":7}}}\n{"type":"result","total_cost_usd":0.012}\n');

    const footer = run(['usage', 'footer', '--agent', 'codex', '--skill', 'define-work', '--file', codex]);
    expect(footer.status).toBe(0);
    expect(footer.stdout.trim()).toBe('Token usage — define-work (codex): 125 total | 100 input | 40 cached input | 0 cache write | 25 output | 5 reasoning');
    expect(run(['usage', 'import', '--agent', 'codex', '--skill', 'define-work', '--file', codex, '--task', 'TICKET-1', '--store', store]).status).toBe(0);
    expect(run(['usage', 'import', '--agent', 'claude', '--skill', 'develop-task', '--file', claude, '--store', store]).status).toBe(0);
    expect(run(['usage', 'import', '--agent', 'codex', '--skill', 'define-work', '--file', codex, '--task', 'TICKET-1', '--store', store]).stdout).toContain('already imported');
    const report = run(['usage', 'report', '--store', store, '--json']);
    expect(report.status).toBe(0);
    const summary = JSON.parse(report.stdout) as Array<{ skill: string; total_tokens: number; cost_usd: number }>;
    expect(summary.find((item) => item.skill === 'define-work')?.total_tokens).toBe(125);
    expect(summary.find((item) => item.skill === 'develop-task')).toMatchObject({ total_tokens: 79, cost_usd: 0.012 });
    expect(await readFile(store, 'utf8')).not.toContain('private prompt');
  });

  it('validates a project config and returns a nonzero exit status for bad config', async () => {
    const project = await tempdir();
    await mkdir(path.join(project, '.beligent'), { recursive: true });
    const config = await templateConfig();
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify(config));
    expect(run(['validate', '--config', path.join(project, '.beligent/config.json')]).status).toBe(0);
    await writeFile(path.join(project, '.beligent/config.json'), JSON.stringify({ ...config, schema_version: 3 }));
    expect(run(['validate', '--config', path.join(project, '.beligent/config.json')]).status).toBe(1);
  });

  it('previews before an explicitly confirmed schema migration and preserves the compatibility mapping', async () => {
    const project = await tempdir();
    const configPath = path.join(project, '.beligent', 'config.json');
    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify(await schema1Config(), null, 2));
    const preview = run(['migrate-config', '--config', configPath]);
    expect(preview.status).toBe(0);
    expect(preview.stdout).toContain('"workflow_mapping": "standard-to-rigorous"');
    expect((JSON.parse(await readFile(configPath, 'utf8')) as ProjectConfig).schema_version).toBe(1);
    expect(run(['migrate-config', '--config', configPath, '--write']).status).toBe(2);
    const write = run(['migrate-config', '--config', configPath, '--adopt-recommended-workflow', '--write', '--confirm']);
    expect(write.status).toBe(0);
    const migrated = JSON.parse(await readFile(configPath, 'utf8')) as Schema2ProjectConfig;
    expect(migrated.schema_version).toBe(2);
    expect(migrated.workflow.rigor).toBe('standard');
    expect(run(['migrate-config', '--config', configPath]).stdout).toContain('"changed": false');
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
    expect(result.stdout).toContain('OK configuration: schema 2, profile standard, rigor standard, design depth current-task');
    expect(result.stdout).toContain('init-project');
    expect(result.stderr).toContain('WARN skills not found');
    expect(result.stderr).toContain('develop-task');
    expect(result.stderr).toContain('diagnose');
    expect(result.stderr).toContain('deliver-work');
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
