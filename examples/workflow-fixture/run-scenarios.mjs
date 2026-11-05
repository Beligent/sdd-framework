import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('.', import.meta.url));
const cases = [
  ['direct bug before fix', './before.mjs', false],
  ['direct fix and tracked implementation', './app.mjs', true],
  ['required failure keeps tracked work open', './before.mjs', false],
  ['post-close audit detects missed original criterion', './audit-regression.mjs', false],
];
for (const [name, module, pass] of cases) {
  const run = spawnSync(process.execPath, ['--test', 'regression.test.mjs'], { cwd, env: { ...process.env, BELIGENT_FIXTURE_MODULE: module }, encoding: 'utf8' });
  if (run.error || run.status === null || (run.status === 0) !== pass) {
    console.error(name, run.error || run.stdout || run.stderr);
    process.exitCode = 1;
  } else {
    console.log(`${name}: ${run.status === 0 ? 'PASS' : 'expected FAIL'} (exit ${run.status})`);
  }
}
