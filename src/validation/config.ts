import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import schema from '../../schema/config.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);
const reservedFiles = new Set([
  'AGENTS.md', 'CLAUDE.md', '.claude/CLAUDE.md', '.github/copilot-instructions.md',
  '.beligent/config.json', '.beligent/setup-state.json', 'skills-lock.json',
]);
const reservedDirectories = ['.git', '.agents/skills', '.claude/skills', '.github/skills', '.codex/skills'];

export interface ConfigIssue { path?: string; message: string }
export type ProjectConfig = {
  schema_version: 1;
  project: { name: string; type: string };
  assistants: string[];
  profile: string;
  technologies: string[];
  artifacts: Record<string, string>;
  tickets: { provider: 'markdown'; paths: { epics: string; tickets: string } };
  profiles: Record<string, { artifacts: string[]; approvals: string[] }>;
};

export function validateConfig(value: unknown, projectRoot?: string, allowTemplate = false): ConfigIssue[] {
  if (isRecord(value) && value.schema_version !== 1) {
    return [{ path: '/schema_version', message: 'unsupported schema_version; schema 1 is required. Propose a separate migration; no files were changed.' }];
  }
  if (isRecord(value) && isRecord(value.profiles)) {
    for (const [name, profile] of Object.entries(value.profiles)) {
      if (isRecord(profile) && Array.isArray(profile.approvals) && (!profile.approvals.includes('implementation') || !profile.approvals.includes('completion'))) {
        return [{ path: `/profiles/${name}/approvals`, message: 'must retain implementation and completion approval' }];
      }
    }
  }
  if (!validateSchema(value)) {
    return (validateSchema.errors ?? []).map((error) => ({
      ...(error.instancePath ? { path: error.instancePath } : {}),
      message: error.message ?? 'does not match schema',
    }));
  }
  const config = value as ProjectConfig;
  const issues: ConfigIssue[] = [];
  if (!config.project.name.trim() || !config.project.type.trim()) {
    issues.push({ path: '/project', message: 'project.name and project.type must not be blank' });
  }
  if (!allowTemplate && [config.project.name, config.project.type].some((value) => value.includes('{{') || value.includes('}}'))) {
    issues.push({ path: '/project', message: 'contains an unrendered project placeholder' });
  }
  if (!Object.hasOwn(config.profiles, config.profile)) {
    issues.push({ path: '/profile', message: `profile '${config.profile}' is not defined in profiles` });
  }
  for (const [name, profile] of Object.entries(config.profiles)) {
    if (!profile.approvals.includes('implementation') || !profile.approvals.includes('completion')) {
      issues.push({ path: `/profiles/${name}/approvals`, message: 'must retain implementation and completion approval' });
    }
  }
  const paths: Array<[string, string]> = [
    ...Object.entries(config.artifacts).map(([name, value]) => [`artifacts.${name}`, value] as [string, string]),
    ['tickets.paths.epics', config.tickets.paths.epics],
    ['tickets.paths.tickets', config.tickets.paths.tickets],
  ];
  for (const [label, value] of paths) issues.push(...pathIssues(label, value, projectRoot));
  checkPathRelationships(config, issues);
  if (projectRoot) {
    for (const [label, value] of paths) {
      const target = path.resolve(projectRoot, value);
      try {
        const info = lstatSync(target);
        if ((label === 'artifacts.overview') !== info.isFile()) {
          issues.push({ path: label, message: `expected a ${label === 'artifacts.overview' ? 'file' : 'directory'} at '${value}'` });
        }
      } catch { /* Nonexistent destinations are valid before setup. */ }
    }
  }
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pathIssues(label: string, value: string, projectRoot?: string): ConfigIssue[] {
  const fail = (message: string): ConfigIssue[] => [{ path: label, message }];
  if (!value || value.includes('\0')) return fail('must be a nonempty project-relative path');
  const parts = value.split('/');
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || path.win32.parse(value).root || value.includes('\\') || parts.some((part) => ['', '.', '..'].includes(part)) || value.includes('{{') || value.includes('}}')) {
    return fail('must be a safe project-relative POSIX path without traversal');
  }
  if (reservedFiles.has(value) || reservedDirectories.some((directory) => value === directory || value.startsWith(`${directory}/`))) {
    return fail('must not use an instruction, configuration or installed-resource path');
  }
  if (projectRoot) {
    let current = path.resolve(projectRoot);
    for (const part of parts) {
      current = path.join(current, part);
      try {
        const item = lstatSync(current);
        if (item.isSymbolicLink()) return fail('must not contain a symlink destination or ancestor');
        if (current === path.resolve(projectRoot, value) && item.isFile() && item.nlink > 1) return fail('must not be a hard-linked output file');
      } catch { break; }
    }
    let absoluteRoot: string;
    try { absoluteRoot = realpathSync(projectRoot); } catch { absoluteRoot = path.resolve(projectRoot); }
    const target = path.resolve(absoluteRoot, value);
    if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) return fail('resolves outside the project');
    try {
      const resolvedTarget = realpathSync(target);
      if (resolvedTarget !== absoluteRoot && !resolvedTarget.startsWith(`${absoluteRoot}${path.sep}`)) return fail('resolves outside the project');
    } catch { /* An output may not exist yet. */ }
  }
  return [];
}

function checkPathRelationships(config: ProjectConfig, issues: ConfigIssue[]): void {
  const paths: Array<[string, string]> = [
    ...Object.entries(config.artifacts).map(([name, value]) => [`artifacts.${name}`, value] as [string, string]),
    ['tickets.paths.epics', config.tickets.paths.epics],
    ['tickets.paths.tickets', config.tickets.paths.tickets],
  ];
  const overview = config.artifacts.overview;
  for (const [name, value] of paths) {
    if (name !== 'artifacts.overview' && (value === overview || value.startsWith(`${overview}/`))) issues.push({ path: name, message: 'overlaps overview file' });
  }
  const { epics, tickets } = config.tickets.paths;
  if (epics === tickets || epics.startsWith(`${tickets}/`) || tickets.startsWith(`${epics}/`)) issues.push({ path: '/tickets/paths', message: 'epic and ticket directories must not overlap' });
  if (overview && (overview.startsWith(`${epics}/`) || overview.startsWith(`${tickets}/`))) issues.push({ path: '/artifacts/overview', message: 'must not live in authoritative epic or ticket directories' });
}

export function parseConfig(text: string): unknown {
  const schemaVersionToken = rejectDuplicateKeys(text);
  const parsed = JSON.parse(text) as unknown;
  if (isRecord(parsed) && parsed.schema_version === 1 && schemaVersionToken !== '1') {
    throw new SyntaxError('schema_version must be the JSON integer 1');
  }
  return parsed;
}

export async function loadConfig(configPath: string): Promise<unknown> {
  return parseConfig(readFileSync(configPath, 'utf8'));
}

function rejectDuplicateKeys(text: string): string | undefined {
  let index = 0;
  let schemaVersionToken: string | undefined;
  const whitespace = (): void => { while (index < text.length && /\s/.test(text[index] ?? '')) index += 1; };
  const string = (): string => {
    const start = index++;
    while (index < text.length) {
      if (text[index] === '\\') index += 2;
      else if (text[index++] === '"') return JSON.parse(text.slice(start, index)) as string;
    }
    throw new SyntaxError('Unterminated JSON string');
  };
  const value = (rootObject = false): void => {
    whitespace();
    if (text[index] === '{') {
      index += 1; whitespace();
      const keys = new Set<string>();
      if (text[index] === '}') { index += 1; return; }
      while (index < text.length) {
        whitespace();
        if (text[index] !== '"') throw new SyntaxError(`Expected object key at character ${index}`);
        const key = string();
        if (keys.has(key)) throw new SyntaxError(`Duplicate JSON key: ${key}`);
        keys.add(key); whitespace();
        if (text[index++] !== ':') throw new SyntaxError(`Expected ':' after object key at character ${index - 1}`);
        const captureSchemaVersion = rootObject && key === 'schema_version';
        whitespace();
        const valueStart = index;
        value();
        if (captureSchemaVersion) schemaVersionToken = text.slice(valueStart, index);
        whitespace();
        const delimiter = text[index++];
        if (delimiter === '}') return;
        if (delimiter !== ',') throw new SyntaxError(`Expected ',' or '}' at character ${index - 1}`);
      }
      throw new SyntaxError('Unterminated JSON object');
    }
    if (text[index] === '[') {
      index += 1; whitespace();
      if (text[index] === ']') { index += 1; return; }
      while (index < text.length) {
        value(); whitespace();
        const delimiter = text[index++];
        if (delimiter === ']') return;
        if (delimiter !== ',') throw new SyntaxError(`Expected ',' or ']' at character ${index - 1}`);
      }
      throw new SyntaxError('Unterminated JSON array');
    }
    if (text[index] === '"') { string(); return; }
    const literal = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(index));
    if (!literal) throw new SyntaxError(`Invalid JSON value at character ${index}`);
    index += literal[0].length;
  };
  value(true); whitespace();
  if (index !== text.length) throw new SyntaxError(`Unexpected content at character ${index}`);
  return schemaVersionToken;
}
