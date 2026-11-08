import { lstat, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_PATH, LEGACY_CONFIG_PATH, SDD_ROOT, parseConfig, pathIssue, validateConfig, type ProjectConfig } from '../validation/config.js';
import { alsoReadsClaudeSkills, hostIds, hostTargets, isHostId, type HostId, type InstructionBridge } from './hosts.js';
import { legacySkills, retiredGuidance, skills, technologies, technologySource } from './inventory.js';

// Deterministic installer. An explicit install, reinstall or upgrade applies one
// replacement policy, so no ownership state or hashes are kept:
// - managed: the five skill directories under each selected root and the selected
//   stack guides are replaced with the packaged bytes, even when edited locally;
// - section: shared instruction files change only between the Beligent SDD markers;
// - project: config is created when missing and otherwise preserved.
// Every other path is left alone. Any conflict or blocker stops all writes.

export const START = '<!-- beligent-sdd:start -->';
export const END = '<!-- beligent-sdd:end -->';
export const policy = 'An explicit install replaces framework-managed skill files and selected stack guides with the packaged version, even if edited locally, and rewrites only the marked Beligent SDD section of shared instruction files. Existing project config, tickets and other files are kept.';

export type Action = 'create' | 'replace' | 'remove' | 'unchanged' | 'add-section' | 'replace-section' | 'keep' | 'conflict';
export type PlanEntry = { path: string; kind: 'managed' | 'section' | 'project'; action: Action; reason?: string; bytes?: Buffer; current?: Buffer };
export type InstallPlan = { projectRoot: string; hosts: HostId[]; stacks: string[]; entries: PlanEntry[]; notes: string[]; blockers: string[] };
export type InstallOptions = { hosts?: string[]; stacks?: string[]; name?: string };

const fragments: Record<InstructionBridge, string> = {
  'AGENTS.md': 'skills/sdd-init/assets/AGENTS.fragment.md',
  'CLAUDE.md': 'skills/sdd-init/assets/CLAUDE.fragment.md',
  '.github/copilot-instructions.md': 'skills/sdd-init/assets/copilot.fragment.md',
};
const discoveryRoots = ['.agents/skills', '.claude/skills', '.github/skills', '.cursor/skills', '.codex/skills', '.windsurf/skills'];
const changes: readonly Action[] = ['create', 'replace', 'remove', 'add-section', 'replace-section'];

async function read(file: string): Promise<Buffer | undefined> {
  try { return await readFile(file); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
}
async function isAbsent(file: string): Promise<boolean> {
  try { await lstat(file); return false; } catch (error) {
    // Invalid, unreadable and linked instructions must reach normal preflight,
    // not be treated as missing and bypassed in favor of another file.
    return (error as NodeJS.ErrnoException).code === 'ENOENT';
  }
}
async function isDirectory(file: string): Promise<boolean> {
  try { return (await lstat(file)).isDirectory(); } catch { return false; }
}
async function files(root: string, relative = ''): Promise<string[]> {
  let entries;
  try { entries = await readdir(path.join(root, relative), { withFileTypes: true }); } catch { return []; }
  const found: string[] = [];
  for (const entry of entries) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...await files(root, child));
    else found.push(child);
  }
  return found.sort();
}

/** Replaces or appends the marked section; returns a reason when the markers are unusable. */
export function mergeSection(current: string | undefined, fragment: string): { action: Action; text: string } | { conflict: string } {
  const section = fragment.trimEnd();
  if (current === undefined) return { action: 'create', text: `${section}\n` };
  const starts = current.split(START).length - 1;
  const ends = current.split(END).length - 1;
  if (!starts && !ends) {
    const separator = !current ? '' : current.endsWith('\n\n') || current.endsWith('\r\n\r\n') ? '' : current.endsWith('\n') ? '\n' : '\n\n';
    return { action: 'add-section', text: `${current}${separator}${section}\n` };
  }
  const first = current.indexOf(START);
  const last = current.indexOf(END);
  const ownLine = (index: number, marker: string): boolean => (index === 0 || current[index - 1] === '\n') && /^(?:\r?\n|$)/.test(current.slice(index + marker.length));
  if (starts !== 1 || ends !== 1 || first > last || !ownLine(first, START) || !ownLine(last, END)) {
    return { conflict: `found ${starts} start and ${ends} end Beligent SDD markers; keep exactly one ${START} line before one ${END} line, then rerun` };
  }
  const text = current.slice(0, first) + section + current.slice(last + END.length);
  return { action: text === current ? 'unchanged' : 'replace-section', text };
}

export async function planInstall(sourceRoot: string, projectRoot: string, options: InstallOptions = {}): Promise<InstallPlan> {
  const root = path.resolve(projectRoot);
  const notes: string[] = [];
  const blockers: string[] = [];
  const entries = new Map<string, PlanEntry>();

  let config: ProjectConfig | undefined;
  const configBytes = await read(path.join(root, CONFIG_PATH));
  if (configBytes) {
    try {
      const parsed = parseConfig(configBytes.toString('utf8'));
      const issues = validateConfig(parsed);
      if (issues.length) blockers.push(`${CONFIG_PATH} cannot be used: ${issues.map((issue) => `${issue.path ? `${issue.path}: ` : ''}${issue.message}`).join('; ')} Fix or move it by hand, then rerun; the installer never rewrites project config.`);
      else config = parsed as ProjectConfig;
    } catch (error) {
      blockers.push(`${CONFIG_PATH} is not valid JSON (${error instanceof Error ? error.message : String(error)}). Fix or move it by hand, then rerun.`);
    }
  }

  const requested = options.hosts ?? config?.hosts ?? [];
  const unknown = requested.filter((host) => !isHostId(host));
  if (unknown.length) notes.push(`Ignoring ${unknown.join(', ')}: not a supported host (${hostIds.join(', ')}).`);
  const hosts = [...new Set(requested.filter(isHostId))];
  if (!hosts.length) blockers.push(`Select at least one supported --host (${hostIds.join(', ')}).`);
  const stacks = [...new Set(options.stacks ?? config?.stacks ?? [])];
  const unsupported = stacks.filter((stack) => !technologies.includes(stack));
  if (unsupported.length) blockers.push(`Unsupported stack ${unsupported.join(', ')}; choose from ${technologies.join(', ')}.`);
  if (config && options.hosts && [...new Set(config.hosts.filter(isHostId))].sort().join() !== [...hosts].sort().join()) notes.push(`${CONFIG_PATH} lists hosts ${config.hosts.join(', ')}; it is kept as is. Edit it by hand to record this selection.`);
  if (config && options.stacks && [...(config.stacks ?? [])].sort().join() !== [...stacks].sort().join()) notes.push(`${CONFIG_PATH} lists stacks ${(config.stacks ?? []).join(', ') || 'none'}; it is kept as is.`);

  const add = async (relative: string, kind: PlanEntry['kind'], bytes: Buffer | undefined): Promise<void> => {
    if (entries.has(relative)) return;
    const unsafe = pathIssue(relative, root);
    const target = path.join(root, relative);
    if (unsafe) { entries.set(relative, { path: relative, kind, action: 'conflict', reason: unsafe }); return; }
    if (await isDirectory(target)) { entries.set(relative, { path: relative, kind, action: 'conflict', reason: 'a directory exists at this path' }); return; }
    let current: Buffer | undefined;
    try { current = await read(target); } catch { entries.set(relative, { path: relative, kind, action: 'conflict', reason: 'an ancestor is not a directory, or the file is unreadable' }); return; }
    const entry: PlanEntry = { path: relative, kind, action: 'unchanged', ...(current ? { current } : {}) };
    if (!bytes) entry.action = current ? 'remove' : 'unchanged';
    else if (kind === 'project') { entry.action = current ? 'keep' : 'create'; if (!current) entry.bytes = bytes; }
    else if (!current) { entry.action = 'create'; entry.bytes = bytes; }
    else if (!current.equals(bytes)) { entry.action = 'replace'; entry.bytes = bytes; }
    entries.set(relative, entry);
  };

  if (!blockers.length) {
    for (const skillRoot of [...new Set(hosts.map((host) => hostTargets[host].skills))]) {
      for (const skill of skills) {
        const packaged = await files(path.join(sourceRoot, 'skills', skill));
        for (const file of packaged) await add(`${skillRoot}/${skill}/${file}`, 'managed', await readFile(path.join(sourceRoot, 'skills', skill, file)));
        for (const file of await files(path.join(root, skillRoot, skill))) if (!packaged.includes(file)) await add(`${skillRoot}/${skill}/${file}`, 'managed', undefined);
      }
    }
    for (const stack of stacks) await add(`${SDD_ROOT}/guidance/${stack}.md`, 'managed', await readFile(path.join(sourceRoot, technologySource(stack))));

    const bridges = new Set(hosts.flatMap((host) => hostTargets[host].instructions as readonly InstructionBridge[]));
    for (const bridge of (['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md'] as const).filter((item) => bridges.has(item))) {
      let destination: string = bridge;
      let fragment = await readFile(path.join(sourceRoot, fragments[bridge]), 'utf8');
      if (bridge === 'CLAUDE.md' && await isAbsent(path.join(root, 'CLAUDE.md')) && !await isAbsent(path.join(root, '.claude/CLAUDE.md'))) {
        destination = '.claude/CLAUDE.md';
        fragment = fragment.replace('@AGENTS.md', '@../AGENTS.md');
      }
      let unsafe = pathIssue(destination, root);
      let current: Buffer | undefined;
      if (!unsafe) {
        try { current = await read(path.join(root, destination)); } catch (error) {
          unsafe = `cannot read it (${(error as NodeJS.ErrnoException).code ?? 'error'}): it, or an ancestor, is not a readable regular file`;
        }
      }
      const text = current?.toString('utf8');
      if (unsafe || (current && !Buffer.from(text!, 'utf8').equals(current))) {
        entries.set(destination, { path: destination, kind: 'section', action: 'conflict', reason: `${unsafe ?? 'not valid UTF-8'}; left intact` });
        continue;
      }
      const merged = mergeSection(text, fragment);
      if ('conflict' in merged) entries.set(destination, { path: destination, kind: 'section', action: 'conflict', reason: `${merged.conflict}; left intact` });
      else entries.set(destination, { path: destination, kind: 'section', action: merged.action, ...(merged.action === 'unchanged' ? {} : { bytes: Buffer.from(merged.text, 'utf8') }), ...(current ? { current } : {}) });
    }

    if (!configBytes) {
      const template = JSON.parse(await readFile(path.join(sourceRoot, 'skills/sdd-init/assets/config.json'), 'utf8')) as ProjectConfig;
      const rendered: ProjectConfig = { ...template, hosts: hosts as ProjectConfig['hosts'], project: { name: options.name?.trim() || path.basename(root) }, stacks: stacks as NonNullable<ProjectConfig['stacks']> };
      const issues = validateConfig(rendered);
      if (issues.length) blockers.push(`Cannot render ${CONFIG_PATH}: ${issues.map((issue) => issue.message).join('; ')}`);
      else await add(CONFIG_PATH, 'project', Buffer.from(`${JSON.stringify(rendered, null, 2)}\n`));
    } else {
      entries.set(CONFIG_PATH, { path: CONFIG_PATH, kind: 'project', action: 'keep' });
    }
  }

  if (await read(path.join(root, LEGACY_CONFIG_PATH)).catch(() => undefined)) notes.push(`Pre-1.0 ${LEGACY_CONFIG_PATH} found. This version ignores it and does not convert it; copy any settings you need by hand and remove it yourself.`);
  const retired = [];
  for (const name of retiredGuidance) if (await read(path.join(root, SDD_ROOT, 'guidance', name)).catch(() => undefined)) retired.push(name);
  if (retired.length) notes.push(`${SDD_ROOT}/guidance/ still holds ${retired.join(', ')} from an earlier version. The framework no longer uses them; delete them when convenient.`);
  if (await read(path.join(root, SDD_ROOT, 'setup-state.json')).catch(() => undefined)) notes.push(`${SDD_ROOT}/setup-state.json is no longer used; the installer ignores it. Delete it when convenient.`);
  const selectedRoots = new Set<string>(hosts.map((host) => hostTargets[host].skills));
  for (const discovery of discoveryRoots) {
    for (const skill of legacySkills) if (await read(path.join(root, discovery, skill, 'SKILL.md')).catch(() => undefined)) notes.push(`Pre-1.0 skill ${discovery}/${skill} found; it is not removed. Delete it by hand to avoid conflicting instructions.`);
    if (!selectedRoots.has(discovery)) {
      const copies = [];
      for (const skill of skills) if (await read(path.join(root, discovery, skill, 'SKILL.md')).catch(() => undefined)) copies.push(skill);
      if (copies.length) notes.push(`${discovery} also contains ${copies.join(', ')} and is not managed by this selection; hosts reading both roots may show duplicates.`);
    }
  }
  if (hosts.includes('claude-code') && hosts.some((host) => alsoReadsClaudeSkills.includes(host))) notes.push('Claude Code uses .claude/skills while the other selected hosts use .agents/skills. Copilot and Cursor can also read .claude/skills, so they may list each skill twice; both copies are identical.');

  return { projectRoot: root, hosts, stacks, entries: [...entries.values()].sort((a, b) => a.path.localeCompare(b.path)), notes, blockers };
}

export const conflicts = (plan: InstallPlan): PlanEntry[] => plan.entries.filter((entry) => entry.action === 'conflict');
export const pending = (plan: InstallPlan): PlanEntry[] => plan.entries.filter((entry) => changes.includes(entry.action));

/** Applies a conflict-free plan. Each file is written through a temporary sibling and renamed into place. */
export async function applyInstall(plan: InstallPlan): Promise<{ written: string[]; error?: string }> {
  if (plan.blockers.length || conflicts(plan).length) return { written: [], error: 'The plan has blockers or conflicts; nothing was written.' };
  const written: string[] = [];
  for (const entry of pending(plan)) {
    const target = path.join(plan.projectRoot, entry.path);
    try {
      const now = await read(target);
      if (now === undefined ? entry.current !== undefined : !entry.current || !now.equals(entry.current)) throw new Error('changed after the plan was made');
      if (entry.action === 'remove') await unlink(target);
      else {
        await mkdir(path.dirname(target), { recursive: true });
        const temporary = `${target}.beligent-${process.pid}.tmp`;
        await writeFile(temporary, entry.bytes!);
        await rename(temporary, target);
      }
      written.push(entry.path);
    } catch (error) {
      return { written, error: `${entry.path}: ${error instanceof Error ? error.message : String(error)}. Rerun the install to finish; completed files will show as unchanged.` };
    }
  }
  return { written };
}

export function formatPlan(plan: InstallPlan, applied?: { written: string[]; error?: string }): string {
  const lines = [`Beligent SDD install for ${plan.projectRoot}${applied ? '' : ' (dry run; rerun with --apply to write)'}`];
  lines.push(`Hosts: ${plan.hosts.join(', ') || 'none'}; stacks: ${plan.stacks.join(', ') || 'none'}`, `Policy: ${policy}`);
  for (const blocker of plan.blockers) lines.push(`BLOCKED ${blocker}`);
  for (const entry of plan.entries) if (entry.action !== 'unchanged') lines.push(`  ${entry.action.padEnd(15)} ${entry.path}${entry.reason ? ` (${entry.reason})` : ''}`);
  const counts = new Map<string, number>();
  for (const entry of plan.entries) counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
  if (plan.entries.length) lines.push(`Summary: ${[...counts].map(([action, count]) => `${count} ${action}`).join(', ')}`);
  for (const note of plan.notes) lines.push(`NOTE ${note}`);
  if (plan.hosts.length) {
    lines.push('Start a workflow skill explicitly:');
    for (const host of plan.hosts) lines.push(`  ${hostTargets[host].label}: ${hostTargets[host].start}`);
  }
  if (applied) lines.push(applied.error ? `FAILED ${applied.error} Written: ${applied.written.length}.` : `Applied ${applied.written.length} change(s).`);
  return lines.join('\n');
}
