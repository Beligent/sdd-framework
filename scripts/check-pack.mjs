import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const cachePath = mkdtempSync(path.join(tmpdir(), 'beligent-npm-pack-'));
let result;
try {
  result = execFileSync('npm', ['pack', '--dry-run', '--json', '--cache', cachePath], { encoding: 'utf8' });
} finally {
  rmSync(cachePath, { recursive: true, force: true });
}
const pack = JSON.parse(result)[0];
const files = pack.files.map((entry) => entry.path);
const problems = [];
const skills = ['sdd-init', 'sdd-define', 'sdd-implement', 'sdd-audit', 'sdd-deliver'];
for (const skill of skills) {
  if (!files.includes(`skills/${skill}/SKILL.md`)) problems.push(`Missing published skill entrypoint: ${skill}`);
}
const runtimeFiles = ['dist/cli/index.js', 'dist/usage/usage.js', 'dist/validation/config.js', 'dist/validation/records.js'];
for (const required of ['README.md', 'LICENSE', 'CHANGELOG.md', 'package.json', ...runtimeFiles, 'schema/config.schema.json']) {
  if (!files.includes(required)) problems.push(`Missing required package file: ${required}`);
}
for (const file of files) {
  if (file.startsWith('skills/') && !skills.includes(file.split('/')[1])) problems.push(`Unexpected skill package: ${file}`);
  if (file.startsWith('schema/') && file !== 'schema/config.schema.json') problems.push(`Unexpected configuration schema: ${file}`);
  if (/^(?:tests|examples|src|scripts|\.github|docs\/plans)\//.test(file) || file.startsWith('dist/') && !runtimeFiles.includes(file) || /(?:^|\/)(?:requirements-dev\.txt|test_validation\.py|__pycache__|\.pyc$)/.test(file)) {
    problems.push(`Development-only file would be published: ${file}`);
  }
}
if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`Package contents validated (${files.length} files, ${pack.size} bytes packed).`);
}
