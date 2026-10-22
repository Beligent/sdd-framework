import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRepository } from './repository.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const errors = await validateRepository(root);
for (const error of errors) console.error(error);
if (errors.length) process.exitCode = 1;
else console.log('Validated nine skills, packaged resources, templates, links and example traceability.');
