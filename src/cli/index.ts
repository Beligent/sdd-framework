#!/usr/bin/env node
import { access, appendFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, parseConfig, previewConfigMigration, validateConfig, type ProjectConfig } from '../validation/config.js';
import { createUsageRecord, formatUsageFooter, parseUsageRecords, summarizeUsage, type SupportedAgent } from '../usage/usage.js';

const root = process.cwd();
const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));

async function version(): Promise<number> {
  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as { version: string };
  console.log(pkg.version);
  return 0;
}

async function validate(args: string[]): Promise<number> {
  let configPath = path.join(root, '.beligent', 'config.json');
  if (args.length > 0) {
    if (args[0] !== '--config' || !args[1] || args.length > 2) {
      console.error('Usage: sdd validate [--config <path>]');
      return 2;
    }
    configPath = path.resolve(root, args[1]);
  }
  try {
    const config = await loadConfig(configPath);
    const issues = validateConfig(config, path.dirname(path.dirname(configPath)));
    if (issues.length) {
      for (const issue of issues) console.error(`${issue.path ? `${issue.path}: ` : ''}${issue.message}`);
      return 1;
    }
    console.log(`Configuration is valid: ${path.relative(root, configPath) || configPath}`);
    return 0;
  } catch (error) {
    console.error(`Cannot validate ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

type MigrationOptions = { configPath: string; adoptRecommendedWorkflow: boolean; write: boolean; confirm: boolean };

function parseMigrationOptions(args: string[]): MigrationOptions | undefined {
  let configPath = path.join(root, '.beligent', 'config.json');
  let adoptRecommendedWorkflow = false;
  let write = false;
  let confirm = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--config' && args[index + 1]) { configPath = path.resolve(root, args[index + 1]!); index += 1; }
    else if (arg === '--adopt-recommended-workflow') adoptRecommendedWorkflow = true;
    else if (arg === '--write') write = true;
    else if (arg === '--confirm') confirm = true;
    else return undefined;
  }
  return { configPath, adoptRecommendedWorkflow, write, confirm };
}

async function migrateConfig(args: string[]): Promise<number> {
  const options = parseMigrationOptions(args);
  if (!options || (options.write && !options.confirm) || (options.confirm && !options.write)) {
    console.error('Usage: sdd migrate-config [--config <path>] [--adopt-recommended-workflow] [--write --confirm]');
    return 2;
  }
  try {
    const before = await readFile(options.configPath, 'utf8');
    const info = await lstat(options.configPath);
    if (info.isSymbolicLink() || info.nlink > 1) {
      console.error(`Refusing to migrate linked configuration: ${options.configPath}`);
      return 1;
    }
    const preview = previewConfigMigration(parseConfig(before), options.adoptRecommendedWorkflow);
    console.log(JSON.stringify({
      source_schema_version: preview.source_schema_version,
      target_schema_version: preview.target_schema_version,
      changed: preview.changed,
      workflow_mapping: preview.workflow_mapping,
      config: preview.config,
    }, null, 2));
    if (!options.write) {
      console.log('\nPreview only. Review this output, then rerun with --write --confirm to apply it.');
      return 0;
    }
    if (!preview.changed) {
      console.log('Configuration is already schema 2; no write was needed.');
      return 0;
    }
    if (await readFile(options.configPath, 'utf8') !== before) {
      console.error(`Configuration changed while preparing migration: ${options.configPath}`);
      return 1;
    }
    await writeFile(options.configPath, `${JSON.stringify(preview.config, null, 2)}\n`, 'utf8');
    console.log(`Migrated configuration: ${options.configPath}`);
    return 0;
  } catch (error) {
    console.error(`Cannot migrate configuration: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const skillRoots = [
  '.agents/skills', '.claude/skills', '.github/skills', '.cursor/skills',
  '.codex/skills', '.opencode/skills', '.windsurf/skills',
];
const coreSkills = ['init-project', 'adopt-project', 'define-work', 'plan-work', 'implement-ticket', 'verify-work', 'develop-task', 'diagnose', 'deliver-work'];

async function exists(file: string): Promise<boolean> {
  try { await access(file); return true; } catch { return false; }
}

async function doctor(args: string[]): Promise<number> {
  if (args.length > 1) {
    console.error('Usage: sdd doctor [project-path]');
    return 2;
  }
  const projectRoot = path.resolve(root, args[0] ?? '.');
  const configPath = path.join(projectRoot, '.beligent', 'config.json');
  let failures = 0;
  console.log(`Project: ${projectRoot}`);
  if (!(await exists(configPath))) {
    console.error('ERROR .beligent/config.json is missing. Use init-project or adopt-project to configure the project.');
    failures += 1;
  } else {
    try {
      const config = parseConfig(await readFile(configPath, 'utf8')) as ProjectConfig;
      const issues = validateConfig(config, projectRoot);
      if (issues.length) {
        console.error('ERROR configuration is invalid:');
        for (const issue of issues) console.error(`  ${issue.path ? `${issue.path}: ` : ''}${issue.message}`);
        failures += 1;
      } else {
        const workflow = config.schema_version === 2 ? `, rigor ${config.workflow.rigor}, design depth ${config.workflow.design_depth}` : '';
        console.log(`OK configuration: schema ${config.schema_version}, profile ${config.profile}${workflow}`);
        for (const [name, configuredPath] of Object.entries(config.artifacts)) {
          const target = path.join(projectRoot, configuredPath);
          if (!(await exists(target))) console.log(`INFO artifact path not created yet: ${name} -> ${configuredPath}`);
        }
        for (const [name, configuredPath] of Object.entries(config.tickets.paths)) {
          const target = path.join(projectRoot, configuredPath);
          if (!(await exists(target))) console.log(`INFO ticket path not created yet: ${name} -> ${configuredPath}`);
        }
      }
    } catch (error) {
      console.error(`ERROR cannot read configuration: ${error instanceof Error ? error.message : String(error)}`);
      failures += 1;
    }
  }

  const discovered = new Set<string>();
  for (const relative of skillRoots) {
    for (const skill of coreSkills) {
      if (await exists(path.join(projectRoot, relative, skill, 'SKILL.md'))) discovered.add(skill);
    }
  }
  const missing = coreSkills.filter((skill) => !discovered.has(skill));
  if (discovered.size) console.log(`OK installed core skills: ${[...discovered].sort().join(', ')}`);
  if (missing.length) console.warn(`WARN skills not found in standard project locations: ${missing.join(', ')}. Install with the skills CLI for your agent.`);
  else console.log('OK all nine core skills are discoverable in standard project locations.');
  console.log(failures ? `Doctor found ${failures} error(s).` : 'Doctor found no configuration errors.');
  return failures ? 1 : 0;
}

type UsageImportOptions = { agent: SupportedAgent; skill: string; file: string; store: string; task?: string };

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseUsageImportOptions(args: string[]): UsageImportOptions | undefined {
  const agent = optionValue(args, '--agent');
  const skill = optionValue(args, '--skill');
  const file = optionValue(args, '--file');
  const store = optionValue(args, '--store') ?? path.join(root, '.beligent', 'usage.jsonl');
  const task = optionValue(args, '--task');
  const allowed = new Set(['--agent', '--skill', '--file', '--store', '--task']);
  for (let index = 0; index < args.length; index += 2) if (!allowed.has(args[index] ?? '') || !args[index + 1]) return undefined;
  if ((agent !== 'codex' && agent !== 'claude') || !skill || !file || !coreSkills.includes(skill)) return undefined;
  return { agent, skill, file: path.resolve(root, file), store: path.resolve(root, store), ...(task ? { task } : {}) };
}

async function usageImport(args: string[]): Promise<number> {
  const options = parseUsageImportOptions(args);
  if (!options) {
    console.error('Usage: sdd usage import --agent <codex|claude> --skill <name> --file <structured-output> [--task <id>] [--store <path>]');
    return 2;
  }
  try {
    const source = await readFile(options.file, 'utf8');
    const item = createUsageRecord(options.agent, options.skill, options.task, source);
    let existing = '';
    try {
      const info = await lstat(options.store);
      if (info.isSymbolicLink() || info.nlink > 1 || !info.isFile()) throw new Error('usage store must be a regular, unlinked file');
      existing = await readFile(options.store, 'utf8');
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    if (parseUsageRecords(existing).some((record) => record.id === item.id)) {
      console.log(`Usage already imported: ${item.id}`);
      return 0;
    }
    await mkdir(path.dirname(options.store), { recursive: true });
    await appendFile(options.store, `${JSON.stringify(item)}\n`, { encoding: 'utf8', mode: 0o600 });
    console.log(`Imported ${item.total_tokens} tokens for ${item.skill} (${item.agent}).`);
    return 0;
  } catch (error) {
    console.error(`Cannot import usage: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function usageReport(args: string[]): Promise<number> {
  let store = path.join(root, '.beligent', 'usage.jsonl');
  let json = false;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--store' && args[index + 1]) { store = path.resolve(root, args[index + 1]!); index += 1; }
    else if (args[index] === '--json') json = true;
    else {
      console.error('Usage: sdd usage report [--store <path>] [--json]');
      return 2;
    }
  }
  try {
    const summary = summarizeUsage(parseUsageRecords(await readFile(store, 'utf8')));
    if (json) console.log(JSON.stringify(summary, null, 2));
    else {
      console.log('Skill\tRuns\tInput\tCached input\tCache write\tOutput\tReasoning\tTotal\tCost USD');
      for (const item of summary) console.log([
        item.skill, item.runs, item.input_tokens, item.cached_input_tokens, item.cache_creation_input_tokens,
        item.output_tokens, item.reasoning_tokens, item.total_tokens, item.cost_usd === undefined ? '—' : item.cost_usd.toFixed(6),
      ].join('\t'));
    }
    return 0;
  } catch (error) {
    console.error(`Cannot report usage: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function usageFooter(args: string[]): Promise<number> {
  const options = parseUsageImportOptions(args);
  if (!options) {
    console.error('Usage: sdd usage footer --agent <codex|claude> --skill <name> --file <structured-output> [--task <id>]');
    return 2;
  }
  try {
    const source = await readFile(options.file, 'utf8');
    console.log(formatUsageFooter(createUsageRecord(options.agent, options.skill, options.task, source)));
    return 0;
  } catch (error) {
    console.error(`Cannot format usage footer: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function usage(args: string[]): Promise<number> {
  const [subcommand, ...rest] = args;
  if (subcommand === 'import') return usageImport(rest);
  if (subcommand === 'report') return usageReport(rest);
  if (subcommand === 'footer') return usageFooter(rest);
  console.error('Usage: sdd usage <import|report|footer>');
  return 2;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  let status: number;
  switch (command) {
    case 'version': status = await version(); break;
    case 'validate': status = await validate(args); break;
    case 'migrate-config': status = await migrateConfig(args); break;
    case 'doctor': status = await doctor(args); break;
    case 'usage': status = await usage(args); break;
    case '--help': case '-h': case undefined:
      console.log('Beligent SDD tooling\n\nUsage: sdd <command>\n\nCommands:\n  validate [--config <path>]  Validate project configuration\n  migrate-config [--config <path>] [--adopt-recommended-workflow] [--write --confirm]\n                              Preview or explicitly apply a schema-1 to schema-2 migration\n  doctor [project-path]       Diagnose configuration and installed skills\n  usage import ...            Import Codex or Claude structured token usage for one skill\n  usage report [--json]       Report locally recorded usage grouped by skill\n  usage footer ...            Format exact host usage for display after a chat response\n  version                     Print the framework version');
      status = command === undefined ? 2 : 0;
      break;
    default:
      console.error(`Unknown command '${command}'. Run sdd --help for usage.`);
      status = 2;
  }
  process.exitCode = status;
}

void main();
