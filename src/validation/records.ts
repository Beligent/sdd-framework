import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { SDD_ROOT, authorizationMode, deliveredAt, pathIssue, type ProjectConfig } from './config.js';

type RecordValue = Record<string, unknown>;
export type Kind = 'ticket' | 'epic' | 'spec';
export type ParsedRecord = { kind: Kind; id: string; file: string; data: RecordValue; body: string };

export const recordKinds: Record<Kind, { dir: string; prefix: string; schema: string; statuses: string[]; fields: string[] }> = {
  ticket: {
    dir: `${SDD_ROOT}/tickets`, prefix: 'TICKET', schema: 'beligent-sdd/ticket/v2',
    statuses: ['todo', 'in-progress', 'blocked', 'done', 'cancelled'],
    fields: ['schema', 'id', 'title', 'status', 'revision', 'epic', 'spec_criteria', 'depends_on', 'blocked_reason', 'cancelled_reason', 'authorization', 'implementation', 'checks', 'history', 'delivery'],
  },
  epic: { dir: `${SDD_ROOT}/epics`, prefix: 'EPIC', schema: 'beligent-sdd/epic/v2', statuses: ['todo', 'in-progress', 'done', 'cancelled'], fields: ['schema', 'id', 'title', 'status'] },
  spec: { dir: `${SDD_ROOT}/specs`, prefix: 'SPEC', schema: 'beligent-sdd/spec/v2', statuses: ['draft', 'active', 'retired'], fields: ['schema', 'id', 'title', 'status'] },
};
const closed = ['done', 'cancelled'];
const checkFields = new Set(['id', 'criteria', 'required', 'command', 'procedure', 'observed', 'by', 'outcome', 'reason', 'at', 'revision', 'snapshot', 'coverage', 'before', 'tests', 'carried_forward']);
const historyFields = new Set(['event', 'revision', 'reason', 'at', 'implementation', 'checks', 'criteria', 'definition']);
const deliveryFields = new Set(['state', 'reference', 'point', 'reason']);
const snapshotPattern = /^git-tree:[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const noConversion = 'Recreate it from the v2 template; there is no automatic conversion.';

function isRecord(value: unknown): value is RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function nonblank(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function positive(value: unknown): value is number { return Number.isInteger(value) && Number(value) > 0; }
function prose(text: string): string { return text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)/gm, ''); }
function stringList(value: unknown): value is string[] { return Array.isArray(value) && value.every((entry) => typeof entry === 'string'); }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

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

/** Criterion headings (`### AC-001`) under the body's `## Acceptance criteria` section, with their text. */
export function acceptanceCriteria(body: string): { ids: string[]; text: Map<string, string> } {
  const ids: string[] = [];
  const text = new Map<string, string>();
  let inSection = false;
  let current: string | undefined;
  for (const line of prose(body).split('\n')) {
    if (/^##\s/.test(line)) { inSection = /^##\s+Acceptance criteria\s*$/i.test(line); current = undefined; continue; }
    if (!inSection) continue;
    const heading = /^###\s+(AC-\d{3,})(?=\s|$)/.exec(line);
    if (heading) { current = heading[1]!; ids.push(current); text.set(current, line.trim()); continue; }
    if (/^#{3,}\s/.test(line)) { current = undefined; continue; }
    if (current) text.set(current, `${text.get(current)}\n${line}`);
  }
  for (const [id, value] of text) text.set(id, value.trim());
  return { ids, text };
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

/** Reads Markdown files from the fixed record directories as project-relative paths. */
export async function readRecordFiles(projectRoot: string): Promise<{ files: Array<{ file: string; text: string }>; errors: string[] }> {
  const files: Array<{ file: string; text: string }> = [];
  const errors: string[] = [];
  for (const { dir } of Object.values(recordKinds)) {
    const unsafe = pathIssue(dir, projectRoot);
    if (unsafe) { errors.push(`${dir}: ${unsafe}`); continue; }
    let entries;
    try { entries = await readdir(path.join(projectRoot, dir), { withFileTypes: true }); } catch { continue; }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) errors.push(`${file}: records live directly in ${dir}/`);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push({ file, text: await readFile(path.join(projectRoot, file), 'utf8') });
    }
  }
  return { files, errors };
}

export function parseRecords(files: Array<{ file: string; text: string }>): { records: ParsedRecord[]; errors: string[] } {
  const records: ParsedRecord[] = [];
  const errors: string[] = [];
  for (const { file, text } of files) {
    const kind = (Object.keys(recordKinds) as Kind[]).find((name) => file.startsWith(`${recordKinds[name].dir}/`));
    if (!kind) continue;
    const definition = recordKinds[kind];
    let parsed: { data: RecordValue; body: string };
    try { parsed = parseFrontmatter(text); } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); continue; }
    const { data, body } = parsed;
    if (!('schema' in data)) { errors.push(`${file}: pre-v2 record (no schema marker). ${noConversion}`); continue; }
    if (data.schema !== definition.schema) { errors.push(`${file}: expected schema "${definition.schema}", found ${JSON.stringify(data.schema)}. ${noConversion}`); continue; }
    const id = data.id;
    if (typeof id !== 'string' || !new RegExp(`^${definition.prefix}-\\d{3,}$`).test(id)) { errors.push(`${file}: id must look like ${definition.prefix}-001`); continue; }
    if (path.posix.basename(file) !== `${id}.md`) { errors.push(`${file}: file name must be ${id}.md`); continue; }
    records.push({ kind, id, file, data, body });
  }
  return { records, errors };
}

function qualify(reference: string, owner: string): string {
  return /^AC-\d{3,}$/.test(reference) ? `${owner}/${reference}` : reference;
}

/** Every criterion a ticket must satisfy: its local headings plus the shared spec criteria it lists. */
export function ticketCriteria(record: ParsedRecord): string[] {
  const local = acceptanceCriteria(record.body).ids.map((id) => `${record.id}/${id}`);
  return [...local, ...(stringList(record.data.spec_criteria) ? record.data.spec_criteria : [])];
}

export function validateRecordSet(records: ParsedRecord[], config: ProjectConfig, projectRoot?: string): string[] {
  const errors: string[] = [];
  const byId = new Map(records.map((record) => [record.id, record]));
  for (const record of records) {
    const { kind, id, data, body } = record;
    const definition = recordKinds[kind];
    const unknown = Object.keys(data).filter((field) => !definition.fields.includes(field));
    if (unknown.length) errors.push(`${id}: unknown fields ${unknown.join(', ')}`);
    if (!nonblank(data.title)) errors.push(`${id}: title must be nonempty`);
    if (!definition.statuses.includes(String(data.status))) errors.push(`${id}: status must be one of ${definition.statuses.join(', ')}`);
    const criteria = acceptanceCriteria(body);
    if (new Set(criteria.ids).size !== criteria.ids.length) errors.push(`${id}: duplicate criterion headings`);
    if (kind === 'spec' && data.status === 'active' && !criteria.ids.length) errors.push(`${id}: an active spec needs at least one ### AC-001 criterion`);
    if (kind === 'epic' && data.status === 'done') {
      const members = records.filter((other) => other.kind === 'ticket' && other.data.epic === id);
      if (!members.length || members.some((member) => !closed.includes(String(member.data.status)))) errors.push(`${id}: a done epic needs member tickets that are all done or cancelled`);
    }
    if (kind === 'ticket') errors.push(...ticketIssues(record, byId, config, projectRoot));
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { errors.push(`Dependency cycle includes ${id}`); return; }
    if (visited.has(id) || !byId.has(id)) return;
    visiting.add(id);
    const dependencies = byId.get(id)?.data.depends_on;
    if (stringList(dependencies)) for (const dependency of dependencies) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const record of records) if (record.kind === 'ticket') visit(record.id);
  return errors;
}

function ticketIssues(record: ParsedRecord, byId: Map<string, ParsedRecord>, config: ProjectConfig, projectRoot?: string): string[] {
  const { id, data } = record;
  const errors: string[] = [];
  const status = String(data.status);
  const open = !closed.includes(status);
  if (!positive(data.revision)) errors.push(`${id}: revision must be a positive integer`);

  const specCriteria = data.spec_criteria;
  if (specCriteria !== undefined) {
    if (!stringList(specCriteria) || specCriteria.some((value) => !/^SPEC-\d{3,}\/AC-\d{3,}$/.test(value))) errors.push(`${id}: spec_criteria must list references like SPEC-001/AC-001`);
    else {
      if (new Set(specCriteria).size !== specCriteria.length) errors.push(`${id}: duplicate spec_criteria`);
      // Done and cancelled tickets are historical; later spec edits must not invalidate them.
      if (open) for (const reference of specCriteria) {
        const [specId, criterion] = reference.split('/');
        const spec = byId.get(specId!);
        if (spec?.kind !== 'spec') errors.push(`${id}: unresolved spec ${specId}`);
        else if (!acceptanceCriteria(spec.body).ids.includes(criterion!)) errors.push(`${id}: unresolved spec criterion ${reference}`);
      }
    }
  }
  const criteria = ticketCriteria(record);
  if (!criteria.length) errors.push(`${id}: needs at least one ### AC-001 criterion or a spec_criteria reference`);

  if (data.epic !== undefined) {
    if (typeof data.epic !== 'string' || !/^EPIC-\d{3,}$/.test(data.epic)) errors.push(`${id}: epic must look like EPIC-001`);
    else if (open && byId.get(data.epic)?.kind !== 'epic') errors.push(`${id}: unresolved epic ${data.epic}`);
  }
  if (data.depends_on !== undefined) {
    if (!stringList(data.depends_on) || data.depends_on.some((value) => !/^TICKET-\d{3,}$/.test(value))) errors.push(`${id}: depends_on must list ticket IDs`);
    else {
      if (data.depends_on.includes(id)) errors.push(`${id}: a ticket cannot depend on itself`);
      if (open) for (const dependency of data.depends_on) if (byId.get(dependency)?.kind !== 'ticket') errors.push(`${id}: unresolved dependency ${dependency}`);
    }
  }
  for (const [field, when] of [['blocked_reason', 'blocked'], ['cancelled_reason', 'cancelled']] as const) {
    if (status === when && !nonblank(data[field])) errors.push(`${id}: ${when} requires ${field}`);
    if (status !== when && data[field] !== undefined) errors.push(`${id}: ${field} is only valid when status is ${when}`);
  }

  const authorization = data.authorization;
  if (authorization !== undefined && (!isRecord(authorization) || Object.keys(authorization).some((key) => !['revision', 'by', 'source'].includes(key)) || !positive(authorization.revision) || !nonblank(authorization.by) || !nonblank(authorization.source))) {
    errors.push(`${id}: authorization needs revision, by and source`);
  }
  if (authorizationMode(config) === 'recorded' && ['in-progress', 'done'].includes(status) && !(isRecord(authorization) && authorization.revision === data.revision)) {
    errors.push(`${id}: this project requires recorded authorization for the current revision before implementation`);
  }

  const implementation = data.implementation;
  const validImplementation = isRecord(implementation) && Object.keys(implementation).every((key) => ['base', 'snapshot'].includes(key)) && nonblank(implementation.base) && typeof implementation.snapshot === 'string' && snapshotPattern.test(implementation.snapshot);
  if (implementation !== undefined && !validImplementation) errors.push(`${id}: implementation needs base (commit) and snapshot (git-tree:<sha> from 'sdd snapshot')`);

  const configured = new Set((config.checks ?? []).map((check) => check.id));
  const checks: RecordValue[] = [];
  if (data.checks !== undefined) {
    if (!Array.isArray(data.checks)) errors.push(`${id}: checks must be a list`);
    else for (const check of data.checks) {
      if (!isRecord(check)) { errors.push(`${id}: each check must be a mapping`); continue; }
      checks.push(check);
      errors.push(...checkIssues(id, check, data.revision, criteria, configured, projectRoot));
    }
    const ids = checks.map((check) => check.id);
    if (new Set(ids).size !== ids.length) errors.push(`${id}: duplicate check ids`);
  }

  if (data.history !== undefined) {
    if (!Array.isArray(data.history)) errors.push(`${id}: history must be a list`);
    else for (const entry of data.history) {
      if (!isRecord(entry) || Object.keys(entry).some((key) => !historyFields.has(key)) || entry.event !== 'revised' || !positive(entry.revision) || !(Number(entry.revision) < Number(data.revision)) || !nonblank(entry.reason)) {
        errors.push(`${id}: history entries need event: revised, an earlier revision and a reason`);
      }
    }
  }

  const delivery = data.delivery;
  if (delivery !== undefined) {
    const state = isRecord(delivery) ? String(delivery.state) : '';
    if (!isRecord(delivery) || Object.keys(delivery).some((key) => !deliveryFields.has(key)) || !['committed', 'pushed', 'pr-open', 'delivered', 'blocked'].includes(state)) errors.push(`${id}: delivery.state must be committed, pushed, pr-open, delivered or blocked`);
    else if (state === 'blocked' ? !nonblank(delivery.reason) : !nonblank(delivery.reference)) errors.push(`${id}: delivery ${state} needs ${state === 'blocked' ? 'a reason' : 'an observed reference'}`);
    else if (state === 'delivered' && delivery.point !== deliveredAt(config)) errors.push(`${id}: delivered point must be the configured delivery point '${deliveredAt(config)}'`);
  }

  if (status === 'done') {
    if (!validImplementation) errors.push(`${id}: done requires implementation with the verified snapshot`);
    else {
      const snapshot = (implementation as RecordValue).snapshot;
      const current = (check: RecordValue): boolean => check.revision === data.revision && (check.snapshot === snapshot || (nonblank(check.procedure) && nonblank(check.carried_forward)));
      for (const check of checks) {
        if (check.required !== true) continue;
        if (!current(check)) errors.push(`${id}: required check '${String(check.id)}' is stale (revision or snapshot differs); rerun it before closing`);
        else if (check.outcome !== 'pass') errors.push(`${id}: required check '${String(check.id)}' is ${String(check.outcome)}; the ticket stays open`);
      }
      const passing = checks.filter((check) => check.required === true && check.outcome === 'pass' && current(check));
      for (const criterion of criteria) {
        const covering = passing.filter((check) => stringList(check.criteria) && check.criteria.map((value) => qualify(value, id)).includes(criterion));
        if (!covering.length) errors.push(`${id}: no passing current required check covers ${criterion}`);
        else if (!covering.some((check) => nonblank(check.command)) && !covering.some((check) => nonblank(check.reason))) errors.push(`${id}: ${criterion} is verified only manually; give a reason why automated coverage is not practical`);
      }
      for (const check of config.checks ?? []) if (check.required && !passing.some((result) => result.id === check.id)) errors.push(`${id}: configured required check '${check.id}' has no passing current result`);
    }
  }
  return errors;
}

function checkIssues(owner: string, check: RecordValue, revision: unknown, criteria: string[], configured: Set<string>, projectRoot?: string): string[] {
  const label = `${owner}: check '${String(check.id)}'`;
  const errors: string[] = [];
  const unknown = Object.keys(check).filter((key) => !checkFields.has(key));
  if (unknown.length) errors.push(`${label} has unknown fields ${unknown.join(', ')}`);
  if (typeof check.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(check.id)) errors.push(`${owner}: check id must be lowercase letters, digits and hyphens`);
  if (typeof check.required !== 'boolean') errors.push(`${label} needs required: true or false`);
  const automated = nonblank(check.command);
  if (automated === nonblank(check.procedure)) errors.push(`${label} needs exactly one of command or procedure`);
  if (!automated && (!nonblank(check.observed) || !nonblank(check.by))) errors.push(`${label} is manual and needs observed and by`);
  if (!['pass', 'fail', 'blocked', 'not-run', 'not-applicable'].includes(String(check.outcome))) errors.push(`${label} outcome must be pass, fail, blocked, not-run or not-applicable`);
  if (check.outcome === 'not-applicable' && (check.required !== false || !nonblank(check.reason))) errors.push(`${label} can be not-applicable only when optional and with a reason`);
  if (!positive(check.revision) || (positive(revision) && check.revision > revision)) errors.push(`${label} needs the ticket revision it verified`);
  if (typeof check.snapshot !== 'string' || !snapshotPattern.test(check.snapshot)) errors.push(`${label} needs snapshot git-tree:<sha>`);
  if (check.at !== undefined && (typeof check.at !== 'string' || Number.isNaN(Date.parse(check.at)))) errors.push(`${label} at must be an ISO date-time`);
  if (check.carried_forward !== undefined && (automated || !nonblank(check.carried_forward))) errors.push(`${label} carried_forward is only for manual checks and needs a reason`);
  if (check.before !== undefined && check.before !== 'fail') errors.push(`${label} before can only be fail (a reproduced failing-before result)`);
  if (check.criteria === undefined) {
    if (!configured.has(String(check.id))) errors.push(`${label} needs criteria or must match a configured check id`);
  } else if (!stringList(check.criteria) || !check.criteria.length) errors.push(`${label} criteria must be a nonempty list`);
  else {
    for (const reference of check.criteria) if (!criteria.includes(qualify(reference, owner))) errors.push(`${label} references ${reference}, which is not one of this ticket's criteria`);
    if (automated && !['added', 'updated', 'existing'].includes(String(check.coverage))) errors.push(`${label} coverage must be added, updated or existing`);
  }
  if (check.coverage !== undefined && !automated) errors.push(`${label} coverage applies only to automated checks`);
  if (check.tests !== undefined) {
    if (!stringList(check.tests)) errors.push(`${label} tests must be a list of paths`);
    else for (const test of check.tests) { const issue = pathIssue(test, projectRoot); if (issue) errors.push(`${label} test path ${test} ${issue}`); }
  }
  return errors;
}

/**
 * Rules between two versions of the records: done and cancelled are final (only ticket
 * delivery may change), history is append-only, and criteria changes need a new revision.
 */
export function transitionErrors(before: ParsedRecord[], after: ParsedRecord[]): string[] {
  const errors: string[] = [];
  const now = new Map(after.map((record) => [record.id, record]));
  for (const previous of before) {
    const current = now.get(previous.id);
    const status = String(previous.data.status);
    const final = previous.kind !== 'spec' && closed.includes(status);
    if (!current) { if (final) errors.push(`${previous.id}: a ${status} record cannot be deleted`); continue; }
    if (final) {
      const frozen = (data: RecordValue): string => canonical(Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'delivery')));
      if (frozen(previous.data) !== frozen(current.data) || previous.body.trimEnd() !== current.body.trimEnd()) {
        errors.push(`${previous.id}: ${status} is final${previous.kind === 'ticket' ? '; only delivery may change' : ''}. Fix problems as ordinary work, or in a new ticket if tracking is requested.`);
      }
      continue;
    }
    if (previous.kind !== 'ticket') continue;
    const oldRevision = Number(previous.data.revision);
    const newRevision = Number(current.data.revision);
    if (newRevision < oldRevision) errors.push(`${previous.id}: revision cannot decrease`);
    const history = Array.isArray(current.data.history) ? current.data.history.map(canonical) : [];
    for (const entry of Array.isArray(previous.data.history) ? previous.data.history : []) if (!history.includes(canonical(entry))) errors.push(`${previous.id}: history entries must be preserved`);
    const scope = (record: ParsedRecord): string => canonical({ local: [...acceptanceCriteria(record.body).text], spec: record.data.spec_criteria ?? [] });
    if (scope(previous) !== scope(current) && newRevision === oldRevision) errors.push(`${previous.id}: criteria changed without incrementing revision`);
    if (newRevision > oldRevision && !(Array.isArray(current.data.history) && current.data.history.some((entry) => isRecord(entry) && entry.revision === oldRevision))) {
      errors.push(`${previous.id}: revision ${newRevision} needs a revised history entry for revision ${oldRevision}`);
    }
  }
  return errors;
}

export async function validateProjectRecords(projectRoot: string, config: ProjectConfig): Promise<string[]> {
  const { files, errors } = await readRecordFiles(projectRoot);
  const { records, errors: parseErrors } = parseRecords(files);
  errors.push(...parseErrors, ...validateRecordSet(records, config, projectRoot));
  for (const { file } of files) errors.push(...await localLinkErrors(path.join(projectRoot, file)));
  return errors;
}
