import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const versionFile = readFileSync('VERSION', 'utf8').trim();
if (packageJson.version !== versionFile) {
  console.error(`Version mismatch: package.json=${packageJson.version}, VERSION=${versionFile}`);
  process.exitCode = 1;
  process.exit();
}

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
for (const skill of ['init-project', 'adopt-project', 'define-work', 'plan-work', 'implement-ticket', 'verify-work', 'develop-task', 'diagnose']) {
  if (!files.includes(`skills/${skill}/SKILL.md`)) problems.push(`Missing published skill entrypoint: ${skill}`);
}
for (const required of ['README.md', 'LICENSE', 'CHANGELOG.md', 'VERSION', 'package.json', 'dist/cli/index.js', 'schema/config.schema.json', 'schema/config-v2.schema.json']) {
  if (!files.includes(required)) problems.push(`Missing required package file: ${required}`);
}
for (const file of files) {
  if (/^(?:tests|examples|src|scripts|\.github|docs\/plans)\//.test(file) || file.startsWith('dist/') && !['dist/cli/index.js', 'dist/validation/config.js'].includes(file) || /(?:^|\/)(?:requirements-dev\.txt|test_validation\.py|__pycache__|\.pyc$)/.test(file)) {
    problems.push(`Development-only file would be published: ${file}`);
  }
}
if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`Package contents validated (${files.length} files, ${pack.size} bytes packed).`);
}
