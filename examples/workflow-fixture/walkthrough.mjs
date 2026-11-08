// Executable walkthrough. Runs the real `sdd` CLI and real tests in a disposable
// Git project; every "observed" line below is checked, not assumed. The developer
// and assistant actions (fixing code, writing tickets) are scripted stand-ins for
// what the commands in quotes would do in a host.
//
//   npm run build && node examples/workflow-fixture/walkthrough.mjs [--keep]
//
// BELIGENT_SDD_CLI may hold a JSON array of node arguments that start the CLI
// instead of ../../dist/cli/index.js (the test suite runs the TypeScript source).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixture = path.dirname(fileURLToPath(import.meta.url));
const cli = process.env.BELIGENT_SDD_CLI ? JSON.parse(process.env.BELIGENT_SDD_CLI) : [path.join(fixture, '../../dist/cli/index.js')];
if (!process.env.BELIGENT_SDD_CLI && !existsSync(cli[0])) throw new Error('Run `npm run build` in the repository first.');
const project = await mkdtemp(path.join(tmpdir(), 'beligent-walkthrough-'));
const run = (command, args, env = {}) => spawnSync(command, args, { cwd: project, encoding: 'utf8', env: { ...process.env, ...env } });
const sdd = (...args) => run(process.execPath, [...cli, ...args]);
const git = (...args) => { const result = run('git', args); if (result.status !== 0) throw new Error(result.stderr); return result.stdout.trim(); };
const nodeTest = (file) => (run(process.execPath, ['--test', file]).status === 0 ? 'pass' : 'fail');
const read = (file) => readFile(path.join(project, file), 'utf8');
const write = async (file, text) => { await mkdir(path.dirname(path.join(project, file)), { recursive: true }); await writeFile(path.join(project, file), text); };
const edit = async (file, from, to) => { const text = await read(file); if (!text.includes(from)) throw new Error(`${file}: missing ${from}`); await write(file, text.replace(from, to)); };
function expect(condition, message) { if (!condition) throw new Error(`Walkthrough check failed: ${message}`); }
function observed(message) { console.log(`  observed: ${message}`); }
const ticketPath = (id) => `.sdd/beligent/tickets/${id}.md`;
// YAML accepts JSON values, so each frontmatter field is written as `key: <json>`.
async function ticket(id, fields, { requirements, criteria, outOfScope = 'Anything else.' }) {
  const front = Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
  const body = [`# ${fields.title}`, '## Context\n\nScripted walkthrough ticket.', `## Requirements\n\n${requirements}`,
    `## Acceptance criteria\n\n${criteria.map(([criterion, text]) => `### ${criterion}\n\n${text}`).join('\n\n')}`, `## Out of scope\n\n${outOfScope}`].join('\n\n');
  await write(ticketPath(id), `---\nschema: beligent-sdd/ticket\nid: ${id}\n${front}\n---\n\n${body}\n`);
}
// The next ID looks at the folder and at Git history, so removed tickets are never reused.
const nextId = () => {
  const used = git('log', '--all', '--name-only', '--format=', '--', '.sdd/beligent/tickets').split('\n')
    .map((line) => /TICKET-(\d+)\.md$/.exec(line)?.[1]).filter(Boolean).map(Number);
  return `TICKET-${String(Math.max(0, ...used) + 1).padStart(3, '0')}`;
};

try {
  for (const file of ['app.mjs', 'regression.test.mjs']) await cp(path.join(fixture, file), path.join(project, file));
  await write('AGENTS.md', '# Project rules\n\nRun `node --test` before handing off a change.\n');
  // Seed two defects: the label bug (ordinary fix) and the count bug (ticket).
  await edit('app.mjs', ".trim() || 'Passport';", '.trim();');
  await edit('app.mjs', 'return Math.max(0, value);', 'return value;');
  git('init', '-q'); git('config', 'user.email', 'walkthrough@example.test'); git('config', 'user.name', 'Walkthrough');
  git('add', '-A'); git('commit', '-qm', 'baseline with two defects');

  console.log('0. "/sdd-init": install for Codex with Node.js guidance, then the reviewed config edit');
  const installed = sdd('install', '--host', 'codex', '--stack', 'nodejs', '--apply');
  expect(installed.status === 0, installed.stderr);
  observed(installed.stdout.split('\n').find((line) => line.startsWith('Applied')));
  expect(/Summary: \d+ unchanged, 1 keep$/m.test(sdd('install').stdout), 'repeat install is a no-op');
  observed('repeat install reports only unchanged files and keeps config');
  const agents = await read('AGENTS.md');
  expect(agents.startsWith('# Project rules\n') && agents.includes('runs only when a prompt starts with'), 'handwritten text kept and guard added');
  observed('AGENTS.md keeps its text and gains the command-only Beligent SDD section');
  const config = JSON.parse(await read('.sdd/beligent/config.json'));
  config.checks = [{ id: 'test', command: 'node --test', paths: ['**/*.mjs'] }];
  await write('.sdd/beligent/config.json', `${JSON.stringify(config, null, 2)}\n`);
  expect(sdd('validate').status === 0, 'config with checks validates');
  observed('config now has check `test` (node --test) covering **/*.mjs; sdd validate exits 0');
  git('add', '-A'); git('commit', '-qm', 'install the Beligent SDD framework');

  console.log('1. No command: "Fix the empty passport label" is ordinary work');
  expect(nodeTest('regression.test.mjs') === 'fail', 'label regression fails before the fix');
  await edit('app.mjs', "String(value ?? '').trim();", "String(value ?? '').trim() || 'Passport';");
  const label = run(process.execPath, ['--test', '--test-name-pattern', 'passport', 'regression.test.mjs']);
  expect(label.status === 0, 'label test passes after the fix');
  expect(!existsSync(path.join(project, '.sdd/beligent/tickets')), 'no tickets directory');
  observed('the label test passes after the fix and no ticket exists');
  git('commit', '-qam', 'fix empty passport label');

  console.log('2. "/sdd-define Clamp negative counts": one ticket, requirements first');
  const one = nextId();
  expect(one === 'TICKET-001', 'first ID');
  const count = { requirements: '`count` never returns a negative number.', criteria: [['AC-001', 'Negative counts clamp to zero; positive counts are preserved.']], outOfScope: 'The sync error that produces negative counts.' };
  await write(ticketPath(one), `---\nschema: beligent-sdd/ticket\nid: ${one}\ntitle: Clamp negative counts\nstatus: todo\n---\n\n# Clamp negative counts\n\n## Acceptance criteria\n\n### AC-001\n`);
  const vague = sdd('validate');
  expect(vague.status === 1 && vague.stderr.includes('needs a nonempty ## Requirements section') && vague.stderr.includes('AC-001 needs text'), 'vague ticket rejected');
  observed('a ticket without requirements or criterion text is rejected');
  await ticket(one, { title: 'Clamp negative counts', status: 'todo', checks_required: ['test'] }, count);
  expect(sdd('validate').status === 0, 'defined ticket validates');
  observed(`${one} is todo with requirements, AC-001 and an out-of-scope list; sdd validate exits 0`);

  console.log(`3. "/sdd-implement ${one}": implement, record checks, set done`);
  await ticket(one, { title: 'Clamp negative counts', status: 'in-progress', checks_required: ['test'] }, count);
  expect(nodeTest('regression.test.mjs') === 'fail', 'count test fails before the fix');
  await edit('app.mjs', 'return value;', 'return Math.max(0, value);');
  expect(nodeTest('regression.test.mjs') === 'pass', 'suite passes after the fix');
  await ticket(one, {
    title: 'Clamp negative counts', status: 'done', checks_required: ['test'],
    checks: [{ id: 'count-regression', criteria: ['AC-001'], command: 'node --test regression.test.mjs', outcome: 'pass' }],
  }, count);
  const unchecked = sdd('validate');
  expect(unchecked.status === 1 && unchecked.stderr.includes("required project check 'test' has no passing result"), 'listed check is enforced');
  observed("done is rejected until the listed check `test` passes");
  await ticket(one, {
    title: 'Clamp negative counts', status: 'done', checks_required: ['test'],
    checks: [{ id: 'count-regression', criteria: ['AC-001'], command: 'node --test regression.test.mjs', outcome: 'pass' }, { id: 'test', command: 'node --test', outcome: 'pass' }],
  }, count);
  const closed = sdd('validate');
  expect(closed.status === 0, closed.stderr);
  observed(`${one} is done: AC-001 and the listed project check pass`);

  console.log('4. Failing and blocked checks keep a ticket open');
  await write('blank-title.test.mjs', "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { title } from './app.mjs';\n\ntest('blank titles read Untitled', () => assert.equal(title('  '), 'Untitled'));\n");
  const blank = { requirements: 'A blank title reads `Untitled`.', criteria: [['AC-001', 'A blank title reads `Untitled`.']] };
  const blankTicket = (status, outcome, extra = {}) => ticket('TICKET-002', {
    title: 'Name blank titles', status, depends_on: [one], ...extra,
    checks: [{ id: 'blank-title', criteria: ['AC-001'], command: 'node --test blank-title.test.mjs', outcome }],
  }, blank);
  expect(nodeTest('blank-title.test.mjs') === 'fail', 'blank-title test fails (not implemented)');
  await blankTicket('done', 'fail');
  const rejected = sdd('validate');
  expect(rejected.status === 1 && rejected.stderr.includes("check 'blank-title' is fail"), 'done with a failed check is rejected');
  observed("done is rejected: check 'blank-title' is fail");
  await blankTicket('blocked', 'blocked', { blocked_reason: 'Product must decide the placeholder text.' });
  expect(sdd('validate').status === 0, 'blocked with a reason is valid');
  observed('TICKET-002 is blocked with a reason for the developer; sdd validate exits 0');
  git('add', '-A'); git('commit', '-qm', 'clamp negative counts');

  console.log(`5. "/sdd-deliver ${one}": the developer agrees to delete the finished ticket before the commit`);
  const criteriaText = count.criteria.map(([criterion, text]) => `${criterion}: ${text}`).join('\n');
  await rm(path.join(project, ticketPath(one)));
  git('add', '-A'); git('commit', '-qm', `Remove finished ${one}: Clamp negative counts\n\n${criteriaText}`);
  expect(git('log', '-1', '--format=%B').includes('AC-001: Negative counts clamp to zero'), 'criteria kept in the commit message');
  expect(sdd('validate').status === 0, 'a dependency on a removed ticket is satisfied');
  observed(`${one} is removed, its criteria stay in the commit message, and TICKET-002 still validates`);
  expect(nextId() === 'TICKET-003', 'IDs are not reused after removal');
  observed('the next ID is TICKET-003, taken from Git history, so a removed ID is never reused');

  console.log('6. Continuing TICKET-003 without a command, then answering "no"');
  await ticket('TICKET-003', { title: 'Trim long titles', status: 'in-progress' }, { requirements: 'Long titles end with an ellipsis.', criteria: [['AC-001', 'Titles over 80 characters end with an ellipsis.']] });
  await edit('app.mjs', 'return String(value).trim();', 'const text = String(value).trim();\n  return text.length > 80 ? `${text.slice(0, 79)}…` : text;');
  const kept = await read('app.mjs');
  await edit(ticketPath('TICKET-003'), 'status: "in-progress"', 'status: "cancelled"\ncancelled_reason: "Continued without the framework"');
  expect(existsSync(path.join(project, ticketPath('TICKET-003'))) && (await read('app.mjs')) === kept, 'ticket kept, code kept');
  expect(sdd('validate').status === 0, 'the cancelled ticket validates');
  observed('TICKET-003 is cancelled with a reason, the code change stays, and the developer continues alone');
  console.log(process.argv.includes('--keep') ? `Project kept at ${project}` : 'All walkthrough checks passed.');
} finally {
  if (!process.argv.includes('--keep')) await rm(project, { recursive: true, force: true });
}
