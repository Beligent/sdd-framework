import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { skills, syncAssets } from '../packaging/sync-assets.js';
import { loadConfig, validateConfig, type ProjectConfig, type Schema2ProjectConfig } from './config.js';

const ticketFields = ['id', 'kind', 'title', 'status', 'readiness', 'priority', 'requirements', 'specifications', 'acceptance_criteria', 'dependencies', 'approval_refs', 'evidence'];
const compactTaskFields = ['id', 'kind', 'status', 'readiness', 'rigor', 'design_depth'];
const listFields = ['requirements', 'specifications', 'acceptance_criteria', 'dependencies', 'approval_refs', 'evidence'];
const statusValues = ['todo', 'in-progress', 'blocked', 'review', 'done', 'cancelled'];
type RecordValue = Record<string, unknown>;
type ParsedArtifact = { data: RecordValue; body: string; file: string };

export function parseFrontmatter(text: string): { data: RecordValue; body: string } {
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) throw new Error('Unclosed frontmatter');
  const document = parseDocument(match[1] ?? '', { uniqueKeys: true });
  if (document.errors.length) throw new Error(document.errors.map((error) => error.message).join('; '));
  const data = document.toJS() as unknown;
  if (!isRecord(data)) throw new Error('Frontmatter must be a mapping');
  return { data, body: text.slice(match[0].length) };
}

function isRecord(value: unknown): value is RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function prose(text: string): string { return text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)/gm, ''); }

function section(body: string, title: string): string | undefined {
  const match = new RegExp(`^##\\s+${title}\\s*$\\n([\\s\\S]*?)(?=^##\\s+|\\s*$)`, 'im').exec(body);
  return match?.[1]?.trim();
}

function compactTaskIssues(id: string, data: RecordValue, body: string, config: Schema2ProjectConfig): string[] {
  const errors: string[] = [];
  if (Object.keys(data).some((field) => !compactTaskFields.includes(field))) errors.push(`${id}: fields differ from compact task contract`);
  if (data.kind !== undefined && data.kind !== 'ticket') errors.push(`${id}: compact task kind must be ticket`);
  if (!statusValues.includes(String(data.status))) errors.push(`${id}: invalid compact task status`);
  if (!['light', 'standard', 'rigorous'].includes(String(data.rigor)) || !['current-task', 'near-term', 'comprehensive'].includes(String(data.design_depth))) errors.push(`${id}: invalid compact task workflow metadata`);
  if (data.rigor !== config.workflow.rigor || data.design_depth !== config.workflow.design_depth) errors.push(`${id}: compact task workflow metadata must match project workflow`);
  if (data.rigor === 'rigorous') errors.push(`${id}: rigorous schema-2 work requires expanded artifacts`);
  if (data.readiness !== undefined && !['preliminary', 'ready'].includes(String(data.readiness))) errors.push(`${id}: invalid compact task readiness`);
  const objective = section(body, 'Objective');
  const behavior = section(body, 'Behavior');
  const criteria = section(body, 'Acceptance criteria');
  const criterionHeadings = criteria?.match(/^#{3,6}\s+AC-\d+(?:\s|$)/gm) ?? [];
  const questions = section(body, 'Blocking questions') ?? section(body, 'Open questions');
  const risks = section(body, 'Consequential risks');
  const evidence = section(body, 'Evidence') ?? section(body, 'Results');
  const ready = data.readiness !== 'preliminary';
  if (ready && !objective) errors.push(`${id}: compact task needs a clear objective`);
  if (ready && !behavior) errors.push(`${id}: compact task needs expected behavior`);
  if (ready && criterionHeadings.length === 0) errors.push(`${id}: compact task needs testable acceptance criteria`);
  if (ready && questions && !/^(none|n\/?a|no blocking questions)\.?$/i.test(questions)) errors.push(`${id}: unresolved blocking questions prevent readiness`);
  if (ready && risks && !/\b(resolved|accepted|escalated)\b/i.test(risks)) errors.push(`${id}: consequential risks must be resolved, accepted, or escalated`);
  if (data.status === 'done' && (!ready || !evidence)) errors.push(`${id}: done compact task requires ready work and evidence`);
  return errors;
}

export async function localLinkErrors(file: string, boundary?: string): Promise<string[]> {
  const text = prose(await readFile(file, 'utf8'));
  const errors: string[] = [];
  const links = text.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g);
  for (const match of links) {
    let target = (match[1] ?? '').trim();
    if (target.startsWith('<') && target.includes('>')) target = target.slice(1, target.indexOf('>'));
    else target = target.split(' "', 1)[0] ?? target;
    let url: URL;
    try { url = new URL(target); if (url.protocol || target.startsWith('//')) continue; }
    catch { /* relative Markdown path */ }
    const [rawPath, rawFragment] = target.split('#', 2);
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(rawPath ?? ''));
    if (boundary && resolved !== path.resolve(boundary) && !resolved.startsWith(`${path.resolve(boundary)}${path.sep}`)) {
      errors.push(`${file}: link escapes installed skill: ${target}`); continue;
    }
    try { await stat(resolved); } catch { errors.push(`${file}: missing local link: ${target}`); continue; }
    if (rawFragment && path.extname(resolved).toLowerCase() === '.md') {
      const linked = prose(await readFile(resolved, 'utf8'));
      const anchors = new Set<string>();
      const counts = new Map<string, number>();
      for (const heading of linked.matchAll(/^#{1,6}\s+(.+?)(?:\s+#+)?$/gm)) {
        const base = (heading[1] ?? '').toLowerCase().replace(/[^\w\- ]/g, '').replace(/ /g, '-');
        const count = counts.get(base) ?? 0;
        anchors.add(count ? `${base}-${count}` : base); counts.set(base, count + 1);
      }
      for (const anchor of linked.matchAll(/(?:id|name)=["']([^"']+)/g)) anchors.add(anchor[1] ?? '');
      if (!anchors.has(decodeURIComponent(rawFragment))) errors.push(`${file}: missing local anchor: ${target}`);
    }
  }
  return errors;
}

async function markdownFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const children = await Promise.all(entries.map(async (entry) => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? markdownFiles(full) : entry.isFile() && full.endsWith('.md') ? [full] : [];
    }));
    return children.flat();
  } catch { return []; }
}

export async function validateProjectRecords(projectRoot: string, config: ProjectConfig): Promise<string[]> {
  const errors: string[] = validateConfig(config, projectRoot).map((issue) => `${issue.path ?? 'config'}: ${issue.message}`);
  if (errors.length) return errors;
  const files = new Set<string>();
  for (const [name, relative] of Object.entries(config.artifacts)) {
    const target = path.join(projectRoot, relative);
    if (name === 'overview') { try { await stat(target); files.add(target); } catch { /* absent is allowed */ } }
    else for (const file of await markdownFiles(target)) files.add(file);
  }
  for (const relative of Object.values(config.tickets.paths)) for (const file of await markdownFiles(path.join(projectRoot, relative))) files.add(file);
  const records = new Map<string, ParsedArtifact>();
  for (const file of [...files].sort()) {
    errors.push(...await localLinkErrors(file));
    try {
      const { data, body } = parseFrontmatter(await readFile(file, 'utf8'));
      if (data.id === undefined) continue;
      if (typeof data.id !== 'string') { errors.push(`${file}: artifact ID must be a string`); continue; }
      if (records.has(data.id)) errors.push(`Duplicate artifact ID: ${data.id}`);
      records.set(data.id, { data, body, file });
      if (!data.id.startsWith('TICKET-') && !data.id.startsWith('EPIC-') && (!Number.isInteger(data.revision) || Number(data.revision) < 1)) errors.push(`${data.id}: document revision must be a positive integer`);
    } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  const configProfile = config.profiles[config.profile];
  for (const [id, record] of records) {
    if (!id.startsWith('TICKET-') && !id.startsWith('EPIC-')) continue;
    const { data } = record;
    const compact = config.schema_version === 2 && id.startsWith('TICKET-') && ('rigor' in data || 'design_depth' in data);
    if (compact) {
      errors.push(...compactTaskIssues(id, data, record.body, config));
      continue;
    }
    if (Object.keys(data).sort().join('|') !== [...ticketFields].sort().join('|')) errors.push(`${id}: fields differ from normalized ticket contract`);
    const expectedKind = id.startsWith('TICKET-') ? 'ticket' : 'epic';
    if (data.kind !== expectedKind || typeof data.title !== 'string' || !data.title.trim()) errors.push(`${id}: invalid kind/title`);
    if (!statusValues.includes(String(data.status)) || !['preliminary', 'ready'].includes(String(data.readiness))) errors.push(`${id}: invalid lifecycle status/readiness`);
    if (!['low', 'medium', 'high', 'urgent'].includes(String(data.priority))) errors.push(`${id}: invalid priority`);
    for (const field of listFields) {
      const values = data[field];
      if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !value)) { errors.push(`${id}: ${field} must be a string list`); continue; }
      if (new Set(values).size !== values.length) errors.push(`${id}: duplicate ${field} references`);
      for (const value of values as string[]) {
        if (field === 'acceptance_criteria') {
          const [artifact, criterion, extra] = value.split('/');
          if (!artifact || !criterion || extra !== undefined || !/^AC-\d+$/.test(criterion) || !records.has(artifact)) { errors.push(`${id}: unresolved acceptance criterion ${value}`); continue; }
          const localLightweight = artifact === id && !configProfile?.artifacts.includes('specification');
          const localSchema2Task = artifact === id && config.schema_version === 2 && ['light', 'standard'].includes(config.workflow.rigor);
          if (!(Array.isArray(data.specifications) && data.specifications.includes(artifact)) && !localLightweight && !localSchema2Task) errors.push(`${id}: criterion ${value} does not belong to a linked specification or local lightweight contract`);
          if (!new RegExp(`^#{1,6}\\s+${criterion}(?:\\s|$)`, 'm').test(records.get(artifact)?.body ?? '')) errors.push(`${id}: missing criterion heading ${value}`);
        } else if (field !== 'evidence' && !records.has(value)) errors.push(`${id}: unresolved ${field} reference ${value}`);
        if (['requirements', 'specifications', 'dependencies', 'approval_refs'].includes(field)) {
          const prefixes: Record<string, string[]> = { requirements: ['REQ-'], specifications: ['SPEC-'], dependencies: ['TICKET-', 'EPIC-'], approval_refs: ['APPR-'] };
          if (!prefixes[field]?.some((prefix) => value.startsWith(prefix))) errors.push(`${id}: incorrect artifact kind in ${field}: ${value}`);
        }
        if (field === 'evidence' && /^[A-Z]+-\d+$/.test(value) && !records.has(value)) errors.push(`${id}: unresolved evidence reference ${value}`);
        if (field === 'approval_refs' && records.has(value)) {
          const approval = records.get(value)!.data;
          if (approval.status !== 'approved' || approval.decision !== 'approved' || typeof approval.approver !== 'string' || !approval.approver.trim() || typeof approval.source !== 'string' || !approval.source.trim()) errors.push(`${id}: ${value} is not a recorded real approval`);
        }
      }
    }
    const readiness = data.readiness === 'ready';
    const schema2CompactReadiness = config.schema_version === 2 && ['light', 'standard'].includes(config.workflow.rigor);
    if (readiness && (!Array.isArray(data.acceptance_criteria) || data.acceptance_criteria.length === 0 || (!schema2CompactReadiness && ((configProfile?.artifacts.includes('requirements') && (!Array.isArray(data.requirements) || !data.requirements.length)) || (configProfile?.artifacts.includes('specification') && (!Array.isArray(data.specifications) || !data.specifications.length)))))) errors.push(`${id}: ready work lacks profile-required traceability`);
    if (data.status === 'done') {
      const refs = Array.isArray(data.approval_refs) ? data.approval_refs : [];
      const completion = refs.some((ref) => {
        if (typeof ref !== 'string' || !records.has(ref)) return false;
        const approval = records.get(ref)!.data;
        const artifacts = approval.artifacts;
        return approval.gate === 'completion' && approval.status === 'approved' && approval.decision === 'approved' && Array.isArray(artifacts) && artifacts.some((entry) => entry === id || isRecord(entry) && entry.id === id);
      });
      if (!readiness || !Array.isArray(data.evidence) || data.evidence.length === 0 || (!schema2CompactReadiness && !completion)) errors.push(`${id}: done requires ready work, evidence and recorded completion acceptance`);
    }
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { errors.push(`Dependency cycle includes ${id}`); return; }
    if (visited.has(id) || !records.has(id)) return;
    visiting.add(id);
    const dependencies = records.get(id)?.data.dependencies;
    if (Array.isArray(dependencies)) for (const dep of dependencies) if (typeof dep === 'string') visit(dep);
    visiting.delete(id); visited.add(id);
  };
  for (const id of records.keys()) visit(id);
  return errors;
}

export async function validateRepository(root: string): Promise<string[]> {
  const errors = await syncAssets(root, true);
  const skillDirs = await readdir(path.join(root, 'skills'), { withFileTypes: true });
  const actual = new Set<string>();
  for (const entry of skillDirs) if (entry.isDirectory()) {
    try { await stat(path.join(root, 'skills', entry.name, 'SKILL.md')); actual.add(entry.name); } catch { /* not a skill */ }
  }
  if ([...actual].sort().join('|') !== [...skills].sort().join('|')) errors.push(`Expected eight core skills; found ${[...actual].sort().join(', ')}`);
  const required = ['README.md', 'AGENTS.md', 'LICENSE', 'VERSION', 'CHANGELOG.md', 'docs/architecture.md', 'docs/artifact-model.md', 'docs/validation.md'];
  const templates: Record<string, string[]> = {
    'init-project': ['project-overview.md', 'config.json'],
    'define-work': ['requirements.md', 'specification.md', 'epic.md', 'ticket.md', 'compact-task.md', 'approval-record.md'],
    'plan-work': ['adr.md', 'implementation-plan.md'],
    'verify-work': ['verification-report.md'],
  };
  for (const [skill, names] of Object.entries(templates)) for (const name of names) required.push(`skills/${skill}/assets/${name}`);
  for (const name of required) if (!(await exists(path.join(root, name)))) errors.push(`Missing required file: ${name}`);
  for (const skill of skills) {
    const dir = path.join(root, 'skills', skill);
    try {
      const entryPath = path.join(dir, 'SKILL.md');
      const { data, body } = parseFrontmatter(await readFile(entryPath, 'utf8'));
      if (data.name !== skill || typeof data.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) || data.name.length > 64) errors.push(`${skill}: invalid name/directory match`);
      if (typeof data.description !== 'string' || data.description.trim().length < 1 || data.description.length > 1024) errors.push(`${skill}: invalid skill description`);
      if (body.split('\n').length > 500) errors.push(`${skill}: entrypoint exceeds 500 lines`);
      for (const file of await markdownFiles(dir)) {
        if (!path.relative(dir, file).split(path.sep).includes('assets')) errors.push(...await localLinkErrors(file, dir));
        try { parseFrontmatter(await readFile(file, 'utf8')); } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); }
      }
    } catch (error) { errors.push(`${skill}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  for (const base of ['docs', 'examples']) for (const file of await markdownFiles(path.join(root, base))) errors.push(...await localLinkErrors(file));
  for (const file of ['README.md', 'AGENTS.md', 'CHANGELOG.md']) errors.push(...await localLinkErrors(path.join(root, file)));
  try {
    const template = await loadConfig(path.join(root, 'skills/init-project/assets/config.json'));
    errors.push(...validateConfig(template, undefined, true).map((issue) => `config template: ${issue.path ?? ''} ${issue.message}`));
  } catch (error) { errors.push(`config template: ${error instanceof Error ? error.message : String(error)}`); }
  const example = path.join(root, 'examples/team-task-tracker');
  try {
    const config = await loadConfig(path.join(example, '.beligent/config.json')) as ProjectConfig;
    errors.push(...await validateProjectRecords(example, config));
  } catch (error) { errors.push(`Missing or invalid worked example configuration: ${error instanceof Error ? error.message : String(error)}`); }
  return errors;
}

async function exists(file: string): Promise<boolean> { try { await stat(file); return true; } catch { return false; } }
