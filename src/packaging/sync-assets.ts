import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const skills = ['init-project', 'adopt-project', 'define-work', 'plan-work', 'implement-ticket', 'verify-work', 'develop-task', 'diagnose', 'deliver-work'];
const technologies = ['react-typescript', 'nextjs', 'nodejs', 'python', 'fastapi'];
export type Mapping = { source: string; destination: string };

export function mappings(): Mapping[] {
  const pairs: Mapping[] = [];
  const governance = 'skills/define-work/references/shared/governance.md';
  for (const skill of skills) if (skill !== 'define-work') pairs.push({ source: governance, destination: `skills/${skill}/references/shared/governance.md` });
  const lifecycle = 'skills/define-work/references/shared/current-task-lifecycle.md';
  for (const skill of ['plan-work', 'implement-ticket', 'verify-work', 'develop-task']) pairs.push({ source: lifecycle, destination: `skills/${skill}/references/shared/current-task-lifecycle.md` });
  const diagnosis = 'skills/diagnose/references/shared/diagnosis-and-simplicity.md';
  for (const skill of ['define-work', 'plan-work', 'implement-ticket', 'verify-work', 'develop-task']) pairs.push({ source: diagnosis, destination: `skills/${skill}/references/shared/diagnosis-and-simplicity.md` });
  for (const skill of ['plan-work', 'implement-ticket', 'verify-work', 'develop-task', 'deliver-work']) {
    for (const name of ['contract.md', 'markdown.md']) pairs.push({ source: `skills/define-work/references/ticket-management/${name}`, destination: `skills/${skill}/references/ticket-management/${name}` });
  }
  for (const name of ['config.json', 'project-overview.md', 'AGENTS.fragment.md', 'CLAUDE.fragment.md', 'copilot.fragment.md']) pairs.push({ source: `skills/init-project/assets/${name}`, destination: `skills/adopt-project/assets/${name}` });
  pairs.push({ source: 'skills/init-project/references/setup.md', destination: 'skills/adopt-project/references/setup.md' });
  for (const name of technologies) for (const skill of ['plan-work', 'develop-task']) pairs.push({ source: `skills/implement-ticket/references/technology/${name}.md`, destination: `skills/${skill}/references/technology/${name}.md` });
  for (const name of ['implementation.md', 'testing.md']) pairs.push({ source: `skills/implement-ticket/references/${name}`, destination: `skills/develop-task/references/${name}` });
  pairs.push({ source: 'skills/verify-work/references/review.md', destination: 'skills/develop-task/references/review.md' });
  pairs.push({ source: 'skills/define-work/assets/compact-task.md', destination: 'skills/develop-task/assets/compact-task.md' });
  pairs.push({ source: 'skills/plan-work/assets/implementation-plan.md', destination: 'skills/develop-task/assets/implementation-plan.md' });
  pairs.push({ source: 'skills/verify-work/assets/verification-report.md', destination: 'skills/develop-task/assets/verification-report.md' });
  return pairs;
}

export async function syncAssets(root: string, check = false): Promise<string[]> {
  const errors: string[] = [];
  const manifests = new Map<string, Record<string, string>>();
  for (const { source, destination } of mappings()) {
    const sourcePath = path.join(root, source);
    const targetPath = path.join(root, destination);
    let data: Buffer;
    try { data = await readFile(sourcePath); } catch { errors.push(`Missing canonical source: ${source}`); continue; }
    if (check) {
      try {
        const current = await readFile(targetPath);
        if (!current.equals(data)) errors.push(`Packaged asset differs: ${destination} (source ${source})`);
      } catch { errors.push(`Packaged asset differs: ${destination} (source ${source})`); }
    } else {
      let current: Buffer | undefined;
      try { current = await readFile(targetPath); } catch { /* missing destination */ }
      if (!current?.equals(data)) {
        await mkdir(path.dirname(targetPath), { recursive: true });
        await writeFile(targetPath, data);
      }
    }
    const [, skill, ...relative] = destination.split('/');
    if (skill) (manifests.get(skill) ?? (manifests.set(skill, {}), manifests.get(skill)!))[relative.join('/')] = source;
  }
  for (const [skill, resources] of manifests) {
    const manifest = `${JSON.stringify({ generated: true, resources: Object.fromEntries(Object.entries(resources).sort(([a], [b]) => a.localeCompare(b))) }, null, 2)}\n`;
    const manifestPath = path.join(root, 'skills', skill, 'PACKAGED.json');
    if (check) {
      try { if ((await readFile(manifestPath, 'utf8')) !== manifest) errors.push(`Packaging manifest differs: skills/${skill}/PACKAGED.json`); }
      catch { errors.push(`Packaging manifest differs: skills/${skill}/PACKAGED.json`); }
    } else {
      let current = '';
      try { current = await readFile(manifestPath, 'utf8'); } catch { /* missing manifest */ }
      if (current !== manifest) await writeFile(manifestPath, manifest);
    }
  }
  return errors;
}
