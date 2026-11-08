// Installation targets. A target names a host surface; `skills` is the physical
// project root it discovers, so targets sharing a root share one generated copy.
// Paths were checked against host documentation on 2026-11-06; none of this is a
// live compatibility claim.
export type InstructionBridge = 'AGENTS.md' | 'CLAUDE.md' | '.github/copilot-instructions.md';
export type HostTarget = {
  label: string;
  skills: string;
  instructions: InstructionBridge[];
  start: string;
  docs: string;
};

export const hostTargets = {
  codex: {
    label: 'Codex (VS Code extension and CLI)',
    skills: '.agents/skills',
    instructions: ['AGENTS.md'],
    start: 'Type `$sdd-implement TICKET-042` or pick the skill from `/skills`.',
    docs: 'https://learn.chatgpt.com/docs/build-skills',
  },
  'claude-code': {
    label: 'Claude Code (VS Code extension and CLI)',
    skills: '.claude/skills',
    instructions: ['AGENTS.md', 'CLAUDE.md'],
    start: 'Start a message with `/sdd-implement TICKET-042`.',
    docs: 'https://code.claude.com/docs/en/skills',
  },
  'github-copilot': {
    label: 'GitHub Copilot (VS Code agent mode and CLI)',
    skills: '.agents/skills',
    instructions: ['AGENTS.md', '.github/copilot-instructions.md'],
    start: 'VS Code: type `/` in chat and select `sdd-implement`, then add `TICKET-042`. Copilot CLI: run `/skills list`, then start the prompt with `/sdd-implement TICKET-042`.',
    docs: 'https://code.visualstudio.com/docs/agent-customization/agent-skills',
  },
  'github-copilot-cloud': {
    label: 'GitHub Copilot cloud agent',
    skills: '.agents/skills',
    instructions: ['AGENTS.md', '.github/copilot-instructions.md'],
    start: 'Commit the files, then assign a task whose text starts with `/sdd-implement TICKET-042`. Copilot picks skills from the prompt; selecting one by command is not documented for the cloud agent.',
    docs: 'https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills',
  },
  cursor: {
    label: 'Cursor Agent',
    skills: '.agents/skills',
    instructions: ['AGENTS.md'],
    start: 'Type `/` in Agent chat and search for `sdd-implement`.',
    docs: 'https://cursor.com/docs/context/skills',
  },
} as const satisfies Record<string, HostTarget>;

export type HostId = keyof typeof hostTargets;
export const hostIds = Object.keys(hostTargets) as HostId[];
export const isHostId = (value: string): value is HostId => Object.hasOwn(hostTargets, value);

// Roots other hosts read in addition to their own; selecting one of these hosts
// together with Claude Code can show the five skills twice.
export const alsoReadsClaudeSkills: readonly HostId[] = ['github-copilot', 'github-copilot-cloud', 'cursor'];
