import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };
const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8')) as { version: string; packages: Record<string, { version?: string }> };
if (pkg.version !== lock.version || pkg.version !== lock.packages['']?.version) {
  console.error(`Version mismatch: package.json=${pkg.version}, package-lock.json=${lock.version}, lock root=${lock.packages['']?.version}`);
  process.exitCode = 1;
} else {
  console.log(`Package and lockfile versions agree: ${pkg.version}`);
}
