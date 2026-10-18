#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, parseConfig, validateConfig, type ProjectConfig } from '../validation/config.js';

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

const skillRoots = [
  '.agents/skills', '.claude/skills', '.github/skills', '.cursor/skills',
  '.codex/skills', '.opencode/skills', '.windsurf/skills',
];
const coreSkills = ['init-project', 'adopt-project', 'define-work', 'plan-work', 'implement-ticket', 'verify-work'];

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
        console.log(`OK configuration: schema ${config.schema_version}, profile ${config.profile}`);
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
  else console.log('OK all six core skills are discoverable in standard project locations.');
  console.log(failures ? `Doctor found ${failures} error(s).` : 'Doctor found no configuration errors.');
  return failures ? 1 : 0;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  let status: number;
  switch (command) {
    case 'version': status = await version(); break;
    case 'validate': status = await validate(args); break;
    case 'doctor': status = await doctor(args); break;
    case '--help': case '-h': case undefined:
      console.log('Beligent SDD tooling\n\nUsage: sdd <command>\n\nCommands:\n  validate [--config <path>]  Validate project configuration\n  doctor [project-path]       Diagnose configuration and installed skills\n  version                     Print the framework version');
      status = command === undefined ? 2 : 0;
      break;
    default:
      console.error(`Unknown command '${command}'. Run sdd --help for usage.`);
      status = 2;
  }
  process.exitCode = status;
}

void main();
