import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SDD_ROOT } from './config.js';

export type Snapshot = { base: string | null; snapshot: string };

function git(cwd: string, args: string[], options: { env?: Record<string, string>; raw?: boolean } = {}): string {
  const output = execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...options.env }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  return options.raw ? output : output.trim();
}

function repository(projectRoot: string): { top: string; prefix: string } {
  let top: string;
  try { top = realpathSync(git(projectRoot, ['rev-parse', '--show-toplevel'])); } catch {
    throw new Error('a Git working tree is required to identify the implementation snapshot');
  }
  const relative = path.relative(top, realpathSync(projectRoot)).split(path.sep).join('/');
  return { top, prefix: relative ? `${relative}/` : '' };
}

/**
 * Identifies the implementation as the Git tree of the whole working tree, including
 * untracked non-ignored files and excluding the project's .sdd/beligent records, so that
 * recording evidence does not change what was verified. A temporary index keeps the real
 * index, working tree and refs untouched; Git may store loose objects.
 */
export function computeSnapshot(projectRoot: string): Snapshot {
  const { top, prefix } = repository(projectRoot);
  let base: string | null;
  try { base = git(top, ['rev-parse', '--verify', '-q', 'HEAD']); } catch { base = null; }
  const directory = mkdtempSync(path.join(tmpdir(), 'beligent-snapshot-'));
  const env = { GIT_INDEX_FILE: path.join(directory, 'index') };
  try {
    if (base) git(top, ['read-tree', base], { env });
    git(top, ['add', '-A', '--', '.'], { env });
    git(top, ['rm', '-r', '--cached', '-q', '--ignore-unmatch', '--', `${prefix}${SDD_ROOT}`], { env });
    return { base, snapshot: `git-tree:${git(top, ['write-tree'], { env })}` };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

/** Returns the project's record files at a Git revision, keyed by project-relative path. */
export function recordFilesAtRef(projectRoot: string, ref: string): Array<{ file: string; text: string }> {
  const { top, prefix } = repository(projectRoot);
  try { git(top, ['rev-parse', '--verify', '-q', `${ref}^{commit}`]); } catch { throw new Error(`unknown Git revision '${ref}'`); }
  const listed = git(top, ['ls-tree', '-r', '--name-only', ref, '--', `${prefix}${SDD_ROOT}`]);
  return listed.split('\n').filter((file) => file.endsWith('.md')).map((file) => ({
    file: file.slice(prefix.length),
    text: git(top, ['show', `${ref}:${file}`], { raw: true }),
  }));
}
