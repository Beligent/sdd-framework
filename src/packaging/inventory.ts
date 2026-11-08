// The packaging contract: the only workflow skills, the stack guides installed into
// `.sdd/beligent/guidance/`, and earlier names that setup and doctor report.
export const skills: readonly string[] = ['sdd-init', 'sdd-define', 'sdd-implement', 'sdd-audit', 'sdd-deliver'];
export const technologies: readonly string[] = ['react-typescript', 'nextjs', 'nodejs', 'python', 'fastapi'];

// Stack guides are the only guidance that applies without a command; the general
// engineering, testing, review and governance guidance lives inside the skills.
export const technologySource = (name: string): string => `skills/sdd-implement/references/technology/${name}.md`;

// Guidance files installed by earlier versions; reported, never deleted.
export const retiredGuidance: readonly string[] = ['engineering.md', 'testing.md', 'review.md', 'shared/governance.md', 'shared/diagnosis-and-simplicity.md'];

export const legacySkills: readonly string[] = ['adopt-project', 'init-project', 'define-work', 'plan-work', 'develop-task', 'implement-ticket', 'verify-work', 'diagnose', 'deliver-work'];
