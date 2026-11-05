import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { skills } from './sync-assets.js';

export const hostRoots = { codex: '.agents/skills', 'claude-code': '.claude/skills', 'github-copilot': '.agents/skills', cursor: '.agents/skills' } as const;
export type PackagedHost = keyof typeof hostRoots;
export type HostFile = { path: string; bytes: Buffer };

// Read-only packaging input for a reviewed sdd-init proposal. Never applies changes
// to the consumer project or resolves assistant discovery on behalf of a live host.
export async function prepareHostPackage(sourceRoot: string, hosts: PackagedHost[], technologies: string[] = []): Promise<HostFile[]> {
  if (!hosts.length || hosts.some((host) => !Object.hasOwn(hostRoots, host))) throw new Error('Select a documented host; Devin/cloud discovery needs separate validation.');
  const files = new Map<string, Buffer>();
  const add = async (source: string, destination: string): Promise<void> => { files.set(destination, await readFile(path.join(sourceRoot, source))); };
  const walk = async (source: string, destination: string): Promise<void> => {
    for (const entry of await readdir(path.join(sourceRoot, source), { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(`${source}/${entry.name}`, `${destination}/${entry.name}`);
      else if (entry.isFile()) await add(`${source}/${entry.name}`, `${destination}/${entry.name}`);
      else throw new Error(`Unsupported installed resource type: ${source}/${entry.name}`);
    }
  };
  for (const root of new Set(hosts.map((host) => hostRoots[host]))) for (const skill of skills) await walk(`skills/${skill}`, `${root}/${skill}`);
  for (const [source, name] of [
    ['sdd-implement/references/implementation.md', 'engineering.md'],
    ['sdd-implement/references/testing.md', 'testing.md'],
    ['sdd-audit/references/review.md', 'review.md'],
    ['sdd-define/references/shared/governance.md', 'shared/governance.md'],
    ['sdd-audit/references/shared/diagnosis-and-simplicity.md', 'shared/diagnosis-and-simplicity.md'],
  ]) await add(`skills/${source}`, `.sdd/beligent/guidance/${name}`);
  for (const technology of new Set(technologies)) {
    if (!['react-typescript', 'nextjs', 'nodejs', 'python', 'fastapi'].includes(technology)) throw new Error(`Unsupported technology: ${technology}`);
    await add(`skills/sdd-implement/references/technology/${technology}.md`, `.sdd/beligent/guidance/${technology}.md`);
  }
  return [...files].sort(([left], [right]) => left.localeCompare(right)).map(([file, bytes]) => ({ path: file, bytes }));
}

export async function preflightHostPackage(projectRoot: string, files: HostFile[]): Promise<string[]> {
  const { lstat } = await import('node:fs/promises');
  const errors: string[] = [];
  for (const file of files) {
    const parts = file.path.split('/');
    if (path.isAbsolute(file.path) || file.path.includes('\\') || parts.some((part) => !part || part === '.' || part === '..') || file.path.startsWith('.git/')) { errors.push(`Unsafe destination: ${file.path}`); continue; }
    let target = path.resolve(projectRoot);
    let safe = true;
    for (const [index, part] of parts.entries()) {
      target = path.join(target, part);
      try {
        const info = await lstat(target);
        if (info.isSymbolicLink() || info.isFile() && (info.nlink > 1 || index < parts.length - 1) || info.isDirectory() && index === parts.length - 1) {
          errors.push(`Unsafe existing destination or ancestor: ${file.path}`); safe = false; break;
        }
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') { errors.push(`Unreadable destination: ${file.path}`); safe = false; } break; }
    }
    if (!safe) continue;
    try {
      const current = await readFile(path.join(projectRoot, file.path));
      if (!current.equals(file.bytes)) errors.push(`Existing content needs reviewed merge: ${file.path}`);
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') errors.push(`Unreadable content: ${file.path}`); }
  }
  return errors;
}
