import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { hostTargets } from '../packaging/hosts.js';
import { skills, syncAssets } from '../packaging/sync-assets.js';
import { loadConfig, validateConfig, type ProjectConfig } from './config.js';
import { TICKET_SCHEMA, localLinkErrors, parseFrontmatter, validateProjectRecords } from './records.js';
export { localLinkErrors, parseFrontmatter, validateProjectRecords } from './records.js';

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.isFile() && file.endsWith('.md') ? [file] : [];
  }))).flat();
}

export async function validateRepository(root: string): Promise<string[]> {
  const errors = await syncAssets(root, true);
  const skillDirs = await readdir(path.join(root, 'skills'), { withFileTypes: true });
  const actual = new Set<string>();
  for (const entry of skillDirs) if (entry.isDirectory()) {
    try { await stat(path.join(root, 'skills', entry.name, 'SKILL.md')); actual.add(entry.name); } catch { /* not a skill */ }
  }
  if ([...actual].sort().join('|') !== [...skills].sort().join('|')) errors.push(`Expected five core skills; found ${[...actual].sort().join(', ')}`);
  const required = ['README.md', 'AGENTS.md', 'LICENSE', 'CHANGELOG.md'];
  const templates: Record<string, string[]> = {
    'sdd-init': ['project-overview.md', 'config.json'],
    'sdd-define': ['ticket.md'],
  };
  for (const [skill, names] of Object.entries(templates)) for (const name of names) required.push(`skills/${skill}/assets/${name}`);
  for (const name of required) if (!(await exists(path.join(root, name)))) errors.push(`Missing required file: ${name}`);
  try {
    const { data } = parseFrontmatter(await readFile(path.join(root, 'skills/sdd-define/assets/ticket.md'), 'utf8'));
    if (data.schema !== TICKET_SCHEMA) errors.push(`skills/sdd-define/assets/ticket.md: template must declare schema ${TICKET_SCHEMA}`);
  } catch (error) { errors.push(`skills/sdd-define/assets/ticket.md: ${error instanceof Error ? error.message : String(error)}`); }
  for (const skill of skills) {
    const dir = path.join(root, 'skills', skill);
    try {
      const entryPath = path.join(dir, 'SKILL.md');
      const { data, body } = parseFrontmatter(await readFile(entryPath, 'utf8'));
      if (data.name !== skill || typeof data.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) || data.name.length > 64) errors.push(`${skill}: invalid name/directory match`);
      if (typeof data.description !== 'string' || data.description.trim().length < 1 || data.description.length > 1024) errors.push(`${skill}: invalid skill description`);
      if (body.split('\n').length > 500) errors.push(`${skill}: entrypoint exceeds 500 lines`);
      // Command-only activation: hosts that read the frontmatter flag, and Codex through agents/openai.yaml.
      if (data['disable-model-invocation'] !== true) errors.push(`${skill}: SKILL.md must set disable-model-invocation: true`);
      try {
        const policy = await readFile(path.join(dir, 'agents/openai.yaml'), 'utf8');
        if (!/^policy:\s*\n\s+allow_implicit_invocation:\s*false\s*$/m.test(policy)) errors.push(`${skill}: agents/openai.yaml must set policy.allow_implicit_invocation: false`);
      } catch { errors.push(`${skill}: agents/openai.yaml is missing`); }
      if (!/\]\(references\/shared\/governance\.md[#)]/.test(body)) errors.push(`${skill}: entrypoint must link the shared guidance references/shared/governance.md`);
      for (const file of await markdownFiles(dir)) {
        if (!path.relative(dir, file).split(path.sep).includes('assets')) errors.push(...await localLinkErrors(file, dir));
        try { parseFrontmatter(await readFile(file, 'utf8')); } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); }
      }
    } catch (error) { errors.push(`${skill}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  try {
    const setup = (await readFile(path.join(root, 'skills/sdd-init/references/setup.md'), 'utf8')).split('\n');
    for (const [host, target] of Object.entries(hostTargets)) {
      if (!setup.some((line) => line.startsWith(`| \`${host}\` |`) && line.includes(`\`${target.skills}\``))) errors.push(`skills/sdd-init/references/setup.md: host table must list \`${host}\` with skill root \`${target.skills}\``);
    }
  } catch (error) { errors.push(`skills/sdd-init/references/setup.md: ${error instanceof Error ? error.message : String(error)}`); }
  for (const file of await markdownFiles(path.join(root, 'examples'))) errors.push(...await localLinkErrors(file));
  for (const file of ['README.md', 'AGENTS.md', 'CHANGELOG.md']) errors.push(...await localLinkErrors(path.join(root, file)));
  try {
    const template = await loadConfig(path.join(root, 'skills/sdd-init/assets/config.json'));
    errors.push(...validateConfig(template, true).map((issue) => `config template: ${issue.path ?? ''} ${issue.message}`));
  } catch (error) { errors.push(`config template: ${error instanceof Error ? error.message : String(error)}`); }
  for (const name of ['workflow-fixture']) {
    const example = path.join(root, 'examples', name);
    try {
      const config = await loadConfig(path.join(example, '.sdd/beligent/config.json')) as ProjectConfig;
      errors.push(...await validateProjectRecords(example, config));
    } catch (error) { errors.push('Missing or invalid ' + name + ' configuration: ' + String(error)); }
  }
  return errors;
}

async function exists(file: string): Promise<boolean> { try { await stat(file); return true; } catch { return false; } }
