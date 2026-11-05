import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { validateConfig, type ProjectConfig } from './config.js';

type RecordValue = Record<string, unknown>;
type ParsedArtifact = { data: RecordValue; body: string; file: string };
const statuses = ['todo', 'in-progress', 'blocked', 'review', 'done', 'cancelled'];
const fields = new Set(['id', 'revision', 'kind', 'title', 'status', 'readiness', 'priority', 'requirements', 'specifications', 'acceptance_criteria', 'dependencies', 'approval_refs', 'evidence', 'rigor', 'design_depth', 'epic', 'tickets', 'implementation', 'checks', 'history', 'delivery', 'authorization']);
const listFields = ['requirements', 'specifications', 'acceptance_criteria', 'dependencies', 'approval_refs', 'evidence', 'tickets'];
function isRecord(value: unknown): value is RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function nonblank(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function positive(value: unknown): boolean { return Number.isInteger(value) && Number(value) > 0; }
function prose(text: string): string { return text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)/gm, ''); }
function criterionIDs(body: string): string[] { return [...prose(body).matchAll(/^#{1,6}\s+(AC-\d+)(?:\s|$)/gm)].map((match) => match[1]!); }

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
  const errors = validateConfig(config, projectRoot).map((issue) => `${issue.path ?? 'config'}: ${issue.message}`);
  if (errors.length) return errors;
  const files = new Set<string>();
  for (const [name, relative] of Object.entries(config.artifacts)) {
    const target = path.join(projectRoot, relative);
    if (name === 'overview') { if (await exists(target)) files.add(target); }
    else for (const file of await markdownFiles(target)) files.add(file);
  }
  for (const relative of Object.values(config.tickets.paths)) for (const file of await markdownFiles(path.join(projectRoot, relative))) files.add(file);
  const records = new Map<string, ParsedArtifact>();
  for (const file of [...files].sort()) {
    errors.push(...await localLinkErrors(file));
    try {
      const { data, body } = parseFrontmatter(await readFile(file, 'utf8'));
      if (data.id === undefined) continue;
      if (typeof data.id !== 'string' || !/^(REQ|SPEC|ADR|PLAN|VERIFY|APPR|EPIC|TICKET)-\d+$/.test(data.id) || Number(data.id.split('-')[1]) < 1) { errors.push(`${file}: invalid stable artifact ID`); continue; }
      if (records.has(data.id)) errors.push(`Duplicate artifact ID: ${data.id}`);
      records.set(data.id, { data, body, file });
      if (!positive(data.revision)) errors.push(`${data.id}: document revision must be a positive integer`);
      const criteria = criterionIDs(body);
      if (new Set(criteria).size !== criteria.length) errors.push(`${data.id}: duplicate criterion IDs`);
    } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  const resolvedCriterion = (reference: string): boolean => {
    const [artifact, criterion, extra] = reference.split('/');
    return !extra && !!artifact && !!criterion && /^AC-\d+$/.test(criterion) && criterionIDs(records.get(artifact)?.body ?? '').includes(criterion);
  };
  for (const [id, record] of records) {
    const { data, body } = record;
    if (!id.startsWith('TICKET-') && !id.startsWith('EPIC-')) continue;
    if (Object.keys(data).some((field) => !fields.has(field))) errors.push(`${id}: unknown record fields; use the default record contract`);
    if (!statuses.includes(String(data.status))) errors.push(`${id}: invalid lifecycle status`);
    if (data.kind !== undefined && data.kind !== (id.startsWith('TICKET-') ? 'ticket' : 'epic')) errors.push(`${id}: invalid kind`);
    if (data.title !== undefined && !nonblank(data.title)) errors.push(`${id}: title must be nonempty`);
    if (data.readiness !== undefined && !['preliminary', 'ready'].includes(String(data.readiness))) errors.push(`${id}: invalid readiness`);
    for (const field of listFields) {
      if (data[field] === undefined) continue;
      if (!Array.isArray(data[field]) || data[field].some((entry: unknown) => !nonblank(entry))) { errors.push(`${id}: ${field} must be a string list`); continue; }
      const values = data[field] as string[];
      if (new Set(values).size !== values.length) errors.push(`${id}: duplicate ${field} references`);
      for (const value of values) {
        if (field === 'acceptance_criteria') {
          if (!resolvedCriterion(value)) errors.push(`${id}: unresolved acceptance criterion ${value}`);
          const source = value.split('/')[0];
          if (source !== id && !(Array.isArray(data.specifications) && data.specifications.includes(source))) errors.push(`${id}: criterion ${value} does not belong to a linked specification or local contract`);
        } else if (field !== 'evidence' && !records.has(value)) errors.push(`${id}: unresolved ${field} reference ${value}`);
        const prefixes: Record<string, string[]> = { requirements: ['REQ-'], specifications: ['SPEC-'], dependencies: ['TICKET-', 'EPIC-'], approval_refs: ['APPR-'], tickets: ['TICKET-'] };
        if (prefixes[field] && !prefixes[field].some((prefix) => value.startsWith(prefix))) errors.push(`${id}: incorrect artifact kind in ${field}: ${value}`);
        if (field === 'evidence' && /^[A-Z]+-\d+$/.test(value) && !records.has(value)) errors.push(`${id}: unresolved evidence ${value}`);
      }
    }
    if (data.epic !== undefined && (typeof data.epic !== 'string' || !data.epic.startsWith('EPIC-') || !records.has(data.epic))) errors.push(`${id}: unresolved epic reference`);
    const criteria = Array.isArray(data.acceptance_criteria) && data.acceptance_criteria.length ? data.acceptance_criteria as string[] : criterionIDs(body).map((criterion) => `${id}/${criterion}`);
    const ready = data.readiness === 'ready' || ['in-progress', 'review', 'done'].includes(String(data.status));
    if (ready && criteria.length === 0) errors.push(`${id}: ready work needs testable acceptance criteria`);
    const blocking = /^## (?:Blocking|Open) questions\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/im.exec(body)?.[1]?.trim();
    if (ready && blocking && !/^(none|n\/?a|no blocking questions)\.?$/i.test(blocking)) errors.push(`${id}: unresolved blocking questions prevent readiness`);
    if (data.history !== undefined && (!Array.isArray(data.history) || data.history.some((entry) => !isRecord(entry) || !positive(entry.revision) || Number(entry.revision) > Number(data.revision) || !nonblank(entry.reason)))) errors.push(`${id}: history entries require a covered revision and reason`);
    if (data.delivery !== undefined) {
      const delivery = data.delivery;
      const validState = isRecord(delivery) && ['ready-for-delivery', 'committed', 'pushed', 'pr-open', 'delivered', 'blocked'].includes(String(delivery.state));
      if (!validState || isRecord(delivery) && ['committed', 'pushed', 'pr-open', 'delivered'].includes(String(delivery.state)) && !nonblank(delivery.reference)) errors.push(`${id}: delivery requires a valid independent state and observed reference`);
      if (isRecord(delivery) && delivery.state === 'delivered' && delivery.point !== config.git.delivery_complete_at) errors.push(`${id}: delivered point differs from configured delivery milestone`);
    }
    const checks: RecordValue[] = [];
    if (data.checks !== undefined) {
      if (!Array.isArray(data.checks)) errors.push(`${id}: checks must be a list`);
      else for (const check of data.checks) {
        if (!isRecord(check)) { errors.push(`${id}: invalid check record`); continue; }
        checks.push(check);
        if (!nonblank(check.id) || typeof check.required !== 'boolean' || !['pass', 'fail', 'blocked', 'unverified', 'not-applicable'].includes(String(check.outcome)) || !positive(check.revision) || !nonblank(check.snapshot) || !(nonblank(check.command) || nonblank(check.procedure)) || !Array.isArray(check.criteria) || !check.criteria.length || check.criteria.some((criterion) => typeof criterion !== 'string' || !criteria.includes(criterion) || !resolvedCriterion(criterion))) errors.push(`${id}: invalid criterion check (id, required, outcome, revision, snapshot, command/procedure and criteria required)`);
        if (check.outcome === 'not-applicable' && !nonblank(check.reason)) errors.push(`${id}: not-applicable check requires a reason`);
      }
      if (new Set(checks.map((check) => check.id)).size !== checks.length) errors.push(`${id}: duplicate check IDs`);
    }
    if (data.status === 'done') {
      if (data.readiness === 'preliminary' || !nonblank(data.implementation) || criteria.length === 0) errors.push(`${id}: done requires ready criteria and an implementation snapshot`);
      const current = (check: RecordValue): boolean => check.revision === data.revision && check.snapshot === data.implementation;
      if (!checks.some((check) => check.required === true)) errors.push(`${id}: done requires structured required checks`);
      for (const check of checks) if (check.required === true && (check.outcome !== 'pass' || !current(check))) errors.push(`${id}: required check ${String(check.id)} failed, blocked, unverified or stale; keep open`);
      for (const criterion of criteria) if (!checks.some((check) => check.required === true && check.outcome === 'pass' && current(check) && Array.isArray(check.criteria) && check.criteria.includes(criterion))) errors.push(`${id}: done lacks passing current evidence for ${criterion}`);
      if (id.startsWith('EPIC-')) {
        const children = data.tickets;
        if (!Array.isArray(children) || !children.length || children.some((child) => typeof child !== 'string' || records.get(child)?.data.status !== 'done')) errors.push(`${id}: done epic requires completed child tickets`);
      }
    }
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { errors.push(`Dependency cycle includes ${id}`); return; }
    if (visited.has(id) || !records.has(id)) return;
    visiting.add(id);
    const dependencies = records.get(id)?.data.dependencies;
    if (Array.isArray(dependencies)) for (const dependency of dependencies) if (typeof dependency === 'string') visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const id of records.keys()) visit(id);
  return errors;
}


async function exists(file: string): Promise<boolean> { try { await stat(file); return true; } catch { return false; } }
