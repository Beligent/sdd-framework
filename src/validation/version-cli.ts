import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };
const version = readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
if (pkg.version !== version) {
  console.error(`Version mismatch: package.json=${pkg.version}, VERSION=${version}`);
  process.exitCode = 1;
} else {
  console.log(`Version sources agree: ${version}`);
}
