import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const skills = ['sdd-init', 'sdd-define', 'sdd-implement', 'sdd-audit', 'sdd-deliver'];
const technologies = ['react-typescript', 'nextjs', 'nodejs', 'python', 'fastapi'];
export type Mapping = { source: string; destination: string };

export function mappings(): Mapping[] {
  const pairs: Mapping[] = [];
  const share = (source: string, targets: string[], relative: string): void => {
    for (const target of targets) pairs.push({ source, destination: `skills/${target}/${relative}` });
  };
  share('skills/sdd-define/references/shared/governance.md', skills.filter((skill) => skill !== 'sdd-define'), 'references/shared/governance.md');
  share('skills/sdd-define/references/shared/current-task-lifecycle.md', ['sdd-implement', 'sdd-audit'], 'references/shared/current-task-lifecycle.md');
  share('skills/sdd-audit/references/shared/diagnosis-and-simplicity.md', ['sdd-define', 'sdd-implement'], 'references/shared/diagnosis-and-simplicity.md');
  for (const name of ['contract.md', 'markdown.md']) share(`skills/sdd-define/references/ticket-management/${name}`, ['sdd-implement', 'sdd-audit', 'sdd-deliver'], `references/ticket-management/${name}`);
  for (const name of technologies) share(`skills/sdd-implement/references/technology/${name}.md`, ['sdd-define'], `references/technology/${name}.md`);
  share('skills/sdd-implement/references/testing.md', ['sdd-audit'], 'references/testing.md');
  share('skills/sdd-audit/references/review.md', ['sdd-implement'], 'references/review.md');
  share('skills/sdd-audit/assets/verification-report.md', ['sdd-implement'], 'assets/verification-report.md');
  for (const [source, name] of [
    ['skills/sdd-implement/references/implementation.md', 'engineering.md'],
    ['skills/sdd-implement/references/testing.md', 'testing.md'],
    ['skills/sdd-audit/references/review.md', 'review.md'],
    ['skills/sdd-define/references/shared/governance.md', 'shared/governance.md'],
    ['skills/sdd-audit/references/shared/diagnosis-and-simplicity.md', 'shared/diagnosis-and-simplicity.md'],
  ]) share(source!, ['sdd-init'], `assets/guidance/${name}`);
  for (const name of technologies) share(`skills/sdd-implement/references/technology/${name}.md`, ['sdd-init'], `assets/guidance/${name}.md`);
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
