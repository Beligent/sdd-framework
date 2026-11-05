import { defineConfig } from 'vitest/config';

// Runnable consumer fixtures use node:test and are exercised as subprocesses by
// the maintainer suite, rather than being collected as Vitest test modules.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
