import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncAssets } from './sync-assets.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const check = process.argv.includes('--check');
const errors = await syncAssets(root, check);
for (const error of errors) console.error(error);
if (errors.length) process.exitCode = 1;
else console.log(check ? 'Packaged assets match canonical sources.' : 'Packaged assets synchronized.');
