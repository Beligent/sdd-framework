import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import schema from '../../schema/config.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

export const CONFIG_SCHEMA = 'beligent-sdd/config/v2';
export const SDD_ROOT = '.sdd/beligent';
export const CONFIG_PATH = `${SDD_ROOT}/config.json`;
export const LEGACY_CONFIG_PATH = '.beligent/config.json';
const noConversion = 'Recreate it from the v2 template; there is no automatic conversion. No files were changed.';

export interface ConfigIssue { path?: string; message: string }
export type Host = 'codex' | 'claude-code' | 'github-copilot' | 'cursor' | 'devin';
export type Permission = 'allowed' | 'ask' | 'never';
export type ConfigCheck = { id: string; command: string; required?: boolean };
export type ProjectConfig = {
  schema: typeof CONFIG_SCHEMA;
  hosts: Host[];
  project?: { name: string };
  stacks?: Array<'react-typescript' | 'nextjs' | 'nodejs' | 'python' | 'fastapi'>;
  checks?: ConfigCheck[];
  tracking?: { required_for?: string[]; authorization?: 'request' | 'recorded' };
  delivery?: { commit?: Permission; push?: Permission; pull_request?: Permission; delivered_at?: 'commit' | 'push' | 'pull-request' | 'merged-pr' };
};

export const configDefaults = {
  tracking: { required_for: [] as string[], authorization: 'request' as const },
  delivery: { commit: 'ask' as const, push: 'ask' as const, pull_request: 'ask' as const, delivered_at: 'merged-pr' as const },
};

export function authorizationMode(config: ProjectConfig): 'request' | 'recorded' {
  return config.tracking?.authorization ?? configDefaults.tracking.authorization;
}

export function deliveredAt(config: ProjectConfig): NonNullable<NonNullable<ProjectConfig['delivery']>['delivered_at']> {
  return config.delivery?.delivered_at ?? configDefaults.delivery.delivered_at;
}

export function validateConfig(value: unknown, allowTemplate = false): ConfigIssue[] {
  if (!isRecord(value)) return [{ message: 'configuration must be a JSON object' }];
  if ('schema_version' in value) {
    return [{ path: '/schema_version', message: `This configuration uses an earlier Beligent schema (schema_version ${JSON.stringify(value.schema_version)}). v2 requires "schema": "${CONFIG_SCHEMA}". ${noConversion}` }];
  }
  if (!('schema' in value)) {
    return [{ path: '/schema', message: `This configuration has no "schema" marker, so it predates v2. v2 requires "schema": "${CONFIG_SCHEMA}". ${noConversion}` }];
  }
  if (value.schema !== CONFIG_SCHEMA) {
    return [{ path: '/schema', message: `Unsupported schema ${JSON.stringify(value.schema)}; this tool supports "${CONFIG_SCHEMA}". No files were changed.` }];
  }
  if (!validateSchema(value)) {
    return (validateSchema.errors ?? []).map((error) => ({
      ...(error.instancePath ? { path: error.instancePath } : {}),
      message: error.message ?? 'does not match schema',
    }));
  }
  const config = value as ProjectConfig;
  const issues: ConfigIssue[] = [];
  if (config.project && !config.project.name.trim()) issues.push({ path: '/project/name', message: 'must not be blank' });
  if (!allowTemplate && config.project && /\{\{|\}\}/.test(config.project.name)) issues.push({ path: '/project/name', message: 'contains an unrendered placeholder' });
  const ids = (config.checks ?? []).map((check) => check.id);
  for (const id of new Set(ids.filter((id, index) => ids.indexOf(id) !== index))) issues.push({ path: '/checks', message: `duplicate check id '${id}'` });
  return issues;
}

/** Locates the v2 configuration, or explains why the project has none. */
export function locateConfig(projectRoot: string): { path: string } | { issue: string } {
  const configPath = path.join(projectRoot, CONFIG_PATH);
  if (existsSync(configPath)) return { path: configPath };
  if (existsSync(path.join(projectRoot, LEGACY_CONFIG_PATH))) {
    return { issue: `Pre-v2 Beligent setup found at .beligent/. v2 reads only ${CONFIG_PATH} and never converts or deletes old files. Run sdd-init for a v2 setup and copy any settings you want to keep by hand.` };
  }
  return { issue: `${CONFIG_PATH} is missing. Run sdd-init to configure the project.` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks a project-relative POSIX path, and with a root, that it stays inside the project without links. */
export function pathIssue(value: unknown, projectRoot?: string): string | undefined {
  if (typeof value !== 'string' || !value || value.includes('\0')) return 'must be a nonempty project-relative path';
  const parts = value.split('/');
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || path.win32.parse(value).root || value.includes('\\') || parts.some((part) => ['', '.', '..'].includes(part))) {
    return 'must be a safe project-relative POSIX path without traversal';
  }
  if (!projectRoot) return undefined;
  let current = path.resolve(projectRoot);
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const item = lstatSync(current);
      if (item.isSymbolicLink()) return 'must not contain a symlink destination or ancestor';
      if (current === path.resolve(projectRoot, value) && item.isFile() && item.nlink > 1) return 'must not be a hard-linked file';
    } catch { break; }
  }
  let absoluteRoot: string;
  try { absoluteRoot = realpathSync(projectRoot); } catch { absoluteRoot = path.resolve(projectRoot); }
  const target = path.resolve(absoluteRoot, value);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) return 'resolves outside the project';
  return undefined;
}

export function parseConfig(text: string): unknown {
  rejectDuplicateKeys(text);
  return JSON.parse(text) as unknown;
}

export async function loadConfig(configPath: string): Promise<unknown> {
  return parseConfig(readFileSync(configPath, 'utf8'));
}

function rejectDuplicateKeys(text: string): void {
  let index = 0;
  const whitespace = (): void => { while (index < text.length && /\s/.test(text[index] ?? '')) index += 1; };
  const string = (): string => {
    const start = index++;
    while (index < text.length) {
      if (text[index] === '\\') index += 2;
      else if (text[index++] === '"') return JSON.parse(text.slice(start, index)) as string;
    }
    throw new SyntaxError('Unterminated JSON string');
  };
  const value = (): void => {
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
        whitespace();
        value();
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
  value(); whitespace();
  if (index !== text.length) throw new SyntaxError(`Unexpected content at character ${index}`);
}
