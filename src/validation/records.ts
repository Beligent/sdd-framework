import { lstat, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { SDD_ROOT, coversEverything, pathIssue, type ProjectConfig } from './config.js';

// The ticket is the only record. It describes the subset of work an AI agent does;
// the developer owns the feature. See README.md.

type RecordValue = Record<string, unknown>;
export type ParsedRecord = { id: string; file: string; data: RecordValue; body: string };

export const TICKET_SCHEMA = 'beligent-sdd/ticket';
export const TICKETS_DIR = `${SDD_ROOT}/tickets`;
/** Record folders from earlier contracts; they are reported, never read. */
export const RETIRED_DIRS = [`${SDD_ROOT}/epics`, `${SDD_ROOT}/specs`];
export const statuses = ['todo', 'in-progress', 'blocked', 'done', 'cancelled'];
export const outcomes = ['pass', 'fail', 'blocked', 'not-run'];
const ticketFields = ['schema', 'id', 'title', 'status', 'depends_on', 'checks_required', 'blocked_reason', 'cancelled_reason', 'checks'];
const checkFields = ['id', 'criteria', 'command', 'procedure', 'observed', 'outcome'];
const idPattern = /^TICKET-\d{3,}$/;
const noConversion = 'Recreate it from the current template; there is no automatic conversion.';

function isRecord(value: unknown): value is RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function nonblank(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function stringList(value: unknown): value is string[] { return Array.isArray(value) && value.every((entry) => typeof entry === 'string'); }
/** Removes fenced code blocks and HTML comments so examples never count as content. */
function prose(text: string): string {
  return text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*(?:\n|$)/gm, '').replace(/<!--[\s\S]*?-->/g, '');
}
/** Normalizes Windows line endings and a byte-order mark before parsing. */
function normalize(text: string): string { return text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'); }

export function parseFrontmatter(source: string): { data: RecordValue; body: string } {
  const text = normalize(source);
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) throw new Error('Unclosed frontmatter');
  const document = parseDocument(match[1] ?? '', { uniqueKeys: true });
  if (document.errors.length) throw new Error(document.errors.map((error) => error.message).join('; '));
  const data = document.toJS() as unknown;
  if (!isRecord(data)) throw new Error('Frontmatter must be a mapping');
  return { data, body: text.slice(match[0].length) };
}

/** Text of each `## Heading` section of a body, keyed by lowercase heading. */
export function sections(body: string): Map<string, string> {
  const result = new Map<string, string>();
  let current: string | undefined;
  for (const line of prose(body).split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) { current = heading[1]!.toLowerCase(); result.set(current, ''); continue; }
    if (current !== undefined) result.set(current, `${result.get(current)}${line}\n`);
  }
  return result;
}

/** Criterion headings (`### AC-001`) under `## Acceptance criteria`, with the text below each. */
export function acceptanceCriteria(body: string): { ids: string[]; text: Map<string, string> } {
  const ids: string[] = [];
  const text = new Map<string, string>();
  let current: string | undefined;
  for (const line of (sections(body).get('acceptance criteria') ?? '').split('\n')) {
    const heading = /^###\s+(AC-\d{3,})(?=\s|$)(.*)$/.exec(line);
    if (heading) { current = heading[1]!; ids.push(current); text.set(current, heading[2]!.trim()); continue; }
    if (/^#{3,}\s/.test(line)) { current = undefined; continue; }
    if (current) text.set(current, `${text.get(current)}\n${line}`);
  }
  for (const [id, value] of text) text.set(id, value.trim());
  return { ids, text };
}

export async function localLinkErrors(file: string, boundary?: string): Promise<string[]> {
  const text = prose(normalize(await readFile(file, 'utf8')));
  const errors: string[] = [];
  for (const match of text.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    let target = (match[1] ?? '').trim();
    if (target.startsWith('<') && target.includes('>')) target = target.slice(1, target.indexOf('>'));
    else target = target.split(' "', 1)[0] ?? target;
    try { const url = new URL(target); if (url.protocol || target.startsWith('//')) continue; }
    catch { /* relative Markdown path */ }
    const [rawPath, rawFragment] = target.split('#', 2);
    let decodedPath: string; let fragment: string | undefined;
    try { decodedPath = decodeURIComponent(rawPath ?? ''); fragment = rawFragment === undefined ? undefined : decodeURIComponent(rawFragment); }
    catch { errors.push(`${file}: malformed link: ${target}`); continue; }
    const resolved = path.resolve(path.dirname(file), decodedPath);
    if (boundary && resolved !== path.resolve(boundary) && !resolved.startsWith(`${path.resolve(boundary)}${path.sep}`)) {
      errors.push(`${file}: link escapes installed skill: ${target}`); continue;
    }
    try { await stat(resolved); } catch { errors.push(`${file}: missing local link: ${target}`); continue; }
    if (fragment && path.extname(resolved).toLowerCase() === '.md') {
      const linked = prose(normalize(await readFile(resolved, 'utf8')));
      const anchors = new Set<string>();
      const counts = new Map<string, number>();
      for (const heading of linked.matchAll(/^#{1,6}\s+(.+?)(?:\s+#+)?$/gm)) {
        const base = (heading[1] ?? '').toLowerCase().replace(/[^\w\- ]/g, '').replace(/ /g, '-');
        const count = counts.get(base) ?? 0;
        anchors.add(count ? `${base}-${count}` : base); counts.set(base, count + 1);
      }
      for (const anchor of linked.matchAll(/(?:id|name)=["']([^"']+)/g)) anchors.add(anchor[1] ?? '');
      if (!anchors.has(fragment)) errors.push(`${file}: missing local anchor: ${target}`);
    }
  }
  return errors;
}

/** Reads ticket files as project-relative paths; anything else in the folder is reported, never skipped silently. */
export async function readRecordFiles(projectRoot: string): Promise<{ files: Array<{ file: string; text: string }>; errors: string[] }> {
  const files: Array<{ file: string; text: string }> = [];
  const errors: string[] = [];
  for (const retired of RETIRED_DIRS) {
    try { await lstat(path.join(projectRoot, retired)); errors.push(`${retired}/: epics and specs are no longer used; move their requirements into tickets, then remove the folder.`); } catch { /* absent */ }
  }
  const unsafe = pathIssue(TICKETS_DIR, projectRoot);
  if (unsafe) return { files, errors: [...errors, `${TICKETS_DIR}: ${unsafe}`] };
  let entries;
  try { entries = await readdir(path.join(projectRoot, TICKETS_DIR), { withFileTypes: true }); } catch { return { files, errors }; }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const file = `${TICKETS_DIR}/${entry.name}`;
    if (entry.name === '.DS_Store' || entry.name === '.gitkeep') continue;
    if (entry.isFile() && entry.name.endsWith('.md')) files.push({ file, text: await readFile(path.join(projectRoot, file), 'utf8') });
    else errors.push(`${file}: tickets are regular .md files directly in ${TICKETS_DIR}/`);
  }
  return { files, errors };
}

export function parseRecords(files: Array<{ file: string; text: string }>): { records: ParsedRecord[]; errors: string[] } {
  const records: ParsedRecord[] = [];
  const errors: string[] = [];
  for (const { file, text } of files) {
    let parsed: { data: RecordValue; body: string };
    try { parsed = parseFrontmatter(text); } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); continue; }
    const { data, body } = parsed;
    if (!('schema' in data)) { errors.push(`${file}: pre-1.0 record (no schema marker). ${noConversion}`); continue; }
    if (data.schema !== TICKET_SCHEMA) { errors.push(`${file}: expected schema "${TICKET_SCHEMA}", found ${JSON.stringify(data.schema)}. ${noConversion}`); continue; }
    const id = data.id;
    if (typeof id !== 'string' || !idPattern.test(id)) { errors.push(`${file}: id must look like TICKET-001`); continue; }
    if (path.posix.basename(file) !== `${id}.md`) { errors.push(`${file}: file name must be ${id}.md`); continue; }
    records.push({ id, file, data, body });
  }
  return { records, errors };
}

export function validateRecordSet(records: ParsedRecord[], config: ProjectConfig): string[] {
  const errors: string[] = [];
  for (const record of records) errors.push(...ticketIssues(record, config));
  const byId = new Map(records.map((record) => [record.id, record]));
  const visiting = new Set<string>(); const visited = new Set<string>(); const reported = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { if (!reported.has(id)) errors.push(`Dependency cycle includes ${id}`); reported.add(id); return; }
    if (visited.has(id) || !byId.has(id)) return; // a removed dependency counts as satisfied
    visiting.add(id);
    const dependencies = byId.get(id)?.data.depends_on;
    if (stringList(dependencies)) for (const dependency of dependencies) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const record of records) visit(record.id);
  return errors;
}

function ticketIssues(record: ParsedRecord, config: ProjectConfig): string[] {
  const { id, data, body } = record;
  const errors: string[] = [];
  const unknown = Object.keys(data).filter((field) => !ticketFields.includes(field));
  if (unknown.length) errors.push(`${id}: unknown fields ${unknown.join(', ')}`);
  if (!nonblank(data.title)) errors.push(`${id}: title must be nonempty`);
  const status = String(data.status);
  if (!statuses.includes(status)) errors.push(`${id}: status must be one of ${statuses.join(', ')}`);

  // Requirements first: a ticket must say what to build and how to check it.
  if (!nonblank(sections(body).get('requirements'))) errors.push(`${id}: needs a nonempty ## Requirements section`);
  const criteria = acceptanceCriteria(body);
  if (!criteria.ids.length) errors.push(`${id}: needs at least one ### AC-001 criterion under ## Acceptance criteria`);
  if (new Set(criteria.ids).size !== criteria.ids.length) errors.push(`${id}: duplicate criterion headings`);
  for (const [criterion, text] of criteria.text) if (!text) errors.push(`${id}: ${criterion} needs text describing an observable result`);

  if (data.depends_on !== undefined) {
    if (!stringList(data.depends_on) || data.depends_on.some((value) => !idPattern.test(value))) errors.push(`${id}: depends_on must list ticket IDs`);
    else if (data.depends_on.includes(id)) errors.push(`${id}: a ticket cannot depend on itself`);
  }
  for (const [field, when] of [['blocked_reason', 'blocked'], ['cancelled_reason', 'cancelled']] as const) {
    if (status === when && !nonblank(data[field])) errors.push(`${id}: ${when} requires ${field}`);
    if (status !== when && data[field] !== undefined) errors.push(`${id}: ${field} is only valid when status is ${when}`);
  }

  const configured = new Map((config.checks ?? []).map((check) => [check.id, check]));
  // Config checks this ticket must pass: those it lists, plus any that cover every change.
  const mandatory = new Set((config.checks ?? []).filter(coversEverything).map((check) => check.id));
  if (data.checks_required !== undefined) {
    if (!stringList(data.checks_required) || new Set(data.checks_required).size !== data.checks_required.length) errors.push(`${id}: checks_required must list distinct config check ids`);
    else for (const listed of data.checks_required) {
      if (configured.has(listed)) mandatory.add(listed);
      else errors.push(`${id}: checks_required lists '${listed}', which is not a check in the config`);
    }
  }
  const checks: RecordValue[] = [];
  if (data.checks !== undefined) {
    if (!Array.isArray(data.checks)) errors.push(`${id}: checks must be a list`);
    else for (const check of data.checks) {
      if (!isRecord(check)) { errors.push(`${id}: each check must be a mapping`); continue; }
      checks.push(check);
      errors.push(...checkIssues(id, check, criteria.ids, configured));
    }
    const ids = checks.map((check) => check.id);
    if (new Set(ids).size !== ids.length) errors.push(`${id}: duplicate check ids`);
  }

  if (status === 'done') {
    for (const check of checks) if (check.outcome !== 'pass') errors.push(`${id}: check '${String(check.id)}' is ${String(check.outcome)}; the ticket stays open`);
    const passing = checks.filter((check) => check.outcome === 'pass');
    for (const criterion of criteria.ids) {
      if (!passing.some((check) => stringList(check.criteria) && check.criteria.includes(criterion))) errors.push(`${id}: no passing check covers ${criterion}`);
    }
    for (const check of mandatory) if (!passing.some((result) => result.id === check)) errors.push(`${id}: required project check '${check}' has no passing result`);
  }
  return errors;
}

function checkIssues(owner: string, check: RecordValue, criteria: string[], configured: Map<string, { command: string }>): string[] {
  const label = `${owner}: check '${String(check.id)}'`;
  const errors: string[] = [];
  const unknown = Object.keys(check).filter((key) => !checkFields.includes(key));
  if (unknown.length) errors.push(`${label} has unknown fields ${unknown.join(', ')}`);
  if (typeof check.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(check.id)) errors.push(`${owner}: check id must be lowercase letters, digits and hyphens`);
  const automated = nonblank(check.command);
  if (automated === nonblank(check.procedure)) errors.push(`${label} needs exactly one of command or procedure`);
  if (!automated && !nonblank(check.observed)) errors.push(`${label} is manual and needs observed`);
  if (!outcomes.includes(String(check.outcome))) errors.push(`${label} outcome must be ${outcomes.join(', ')}`);
  const project = configured.get(String(check.id));
  if (project && check.command !== project.command) errors.push(`${label} must record the configured command '${project.command}'`);
  if (check.criteria === undefined) {
    if (!project) errors.push(`${label} needs criteria or must match a configured check id`);
  } else if (!stringList(check.criteria) || !check.criteria.length) errors.push(`${label} criteria must be a nonempty list`);
  else for (const reference of check.criteria) if (!criteria.includes(reference)) errors.push(`${label} references ${reference}, which is not one of this ticket's criteria`);
  return errors;
}

export async function validateProjectRecords(projectRoot: string, config: ProjectConfig): Promise<string[]> {
  const { files, errors } = await readRecordFiles(projectRoot);
  const { records, errors: parseErrors } = parseRecords(files);
  errors.push(...parseErrors, ...validateRecordSet(records, config));
  for (const { file } of files) errors.push(...await localLinkErrors(path.join(projectRoot, file)));
  return errors;
}
