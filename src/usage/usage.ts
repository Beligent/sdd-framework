import { createHash } from 'node:crypto';

export type SupportedAgent = 'codex' | 'claude';

export type TokenUsage = {
  input_tokens: number;
  cached_input_tokens: number;
  cache_creation_input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  cost_usd?: number;
};

export type UsageRecord = TokenUsage & {
  schema_version: 1;
  id: string;
  recorded_at: string;
  agent: SupportedAgent;
  skill: string;
  task?: string;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function normalizedUsage(value: unknown): TokenUsage | undefined {
  const usage = record(value);
  if (!usage) return undefined;
  const inputDetails = record(usage.input_tokens_details);
  const outputDetails = record(usage.output_tokens_details);
  const input = number(usage.input_tokens) ?? number(usage.prompt_tokens);
  const output = number(usage.output_tokens) ?? number(usage.completion_tokens);
  if (input === undefined && output === undefined) return undefined;
  const cached = number(usage.cache_read_input_tokens) ?? number(usage.cached_input_tokens) ?? number(inputDetails?.cached_tokens) ?? 0;
  const cacheCreation = number(usage.cache_creation_input_tokens) ?? 0;
  const reasoning = number(usage.reasoning_tokens) ?? number(outputDetails?.reasoning_tokens) ?? 0;
  return {
    input_tokens: input ?? 0,
    cached_input_tokens: cached,
    cache_creation_input_tokens: cacheCreation,
    output_tokens: output ?? 0,
    reasoning_tokens: reasoning,
    total_tokens: number(usage.total_tokens) ?? (input ?? 0) + (output ?? 0),
  };
}

function documents(text: string): unknown[] {
  try { return [JSON.parse(text) as unknown]; } catch { /* Try JSONL below. */ }
  const result: unknown[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try { result.push(JSON.parse(line) as unknown); }
    catch { throw new SyntaxError(`Invalid JSON on line ${index + 1}`); }
  }
  if (!result.length) throw new SyntaxError('Usage source is empty');
  return result;
}

function candidates(document: unknown): unknown[] {
  const item = record(document);
  if (!item) return [];
  return [item.usage, record(item.response)?.usage, record(item.turn)?.usage, record(item.message)?.usage];
}

function terminalUsage(items: unknown[]): TokenUsage | undefined {
  for (const item of [...items].reverse()) {
    for (const candidate of candidates(item)) {
      const usage = normalizedUsage(candidate);
      if (usage) return usage;
    }
  }
  return undefined;
}

function sumClaudeMessages(items: unknown[]): TokenUsage | undefined {
  const usages = items.flatMap((item) => {
    const value = record(item);
    if (value?.type !== 'assistant') return [];
    const usage = normalizedUsage(record(value.message)?.usage);
    return usage ? [usage] : [];
  });
  if (!usages.length) return undefined;
  return usages.reduce<TokenUsage>((sum, usage) => ({
    input_tokens: sum.input_tokens + usage.input_tokens,
    cached_input_tokens: sum.cached_input_tokens + usage.cached_input_tokens,
    cache_creation_input_tokens: sum.cache_creation_input_tokens + usage.cache_creation_input_tokens,
    output_tokens: sum.output_tokens + usage.output_tokens,
    reasoning_tokens: sum.reasoning_tokens + usage.reasoning_tokens,
    total_tokens: sum.total_tokens + usage.input_tokens + usage.cached_input_tokens + usage.cache_creation_input_tokens + usage.output_tokens,
  }), { input_tokens: 0, cached_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0, reasoning_tokens: 0, total_tokens: 0 });
}

export function parseAgentUsage(agent: SupportedAgent, text: string): TokenUsage {
  const items = documents(text);
  const final = [...items].reverse().map(record).find((item) => item?.type === 'result');
  const finalUsage = final ? normalizedUsage(final.usage) : undefined;
  if (agent === 'claude' && finalUsage && number(record(final?.usage)?.total_tokens) === undefined) {
    finalUsage.total_tokens = finalUsage.input_tokens + finalUsage.cached_input_tokens + finalUsage.cache_creation_input_tokens + finalUsage.output_tokens;
  }
  const usage = agent === 'claude' ? finalUsage ?? sumClaudeMessages(items) : terminalUsage(items);
  if (!usage) throw new Error(`No token usage found in ${agent} structured output`);
  const cost = number(final?.total_cost_usd);
  return cost === undefined ? usage : { ...usage, cost_usd: cost };
}

export function createUsageRecord(agent: SupportedAgent, skill: string, task: string | undefined, source: string, recordedAt = new Date().toISOString()): UsageRecord {
  const usage = parseAgentUsage(agent, source);
  const id = createHash('sha256').update(JSON.stringify({ agent, skill, task: task ?? null, source })).digest('hex');
  return { schema_version: 1, id, recorded_at: recordedAt, agent, skill, ...(task ? { task } : {}), ...usage };
}

export function parseUsageRecords(text: string): UsageRecord[] {
  if (!text.trim()) return [];
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line) as UsageRecord; }
    catch { throw new SyntaxError(`Invalid usage store JSON on line ${index + 1}`); }
  });
}

export type UsageSummary = TokenUsage & { skill: string; runs: number };

export function summarizeUsage(records: UsageRecord[]): UsageSummary[] {
  const summaries = new Map<string, UsageSummary>();
  for (const item of records) {
    const current = summaries.get(item.skill) ?? {
      skill: item.skill, runs: 0, input_tokens: 0, cached_input_tokens: 0, cache_creation_input_tokens: 0,
      output_tokens: 0, reasoning_tokens: 0, total_tokens: 0,
    };
    current.runs += 1;
    current.input_tokens += item.input_tokens;
    current.cached_input_tokens += item.cached_input_tokens;
    current.cache_creation_input_tokens += item.cache_creation_input_tokens;
    current.output_tokens += item.output_tokens;
    current.reasoning_tokens += item.reasoning_tokens;
    current.total_tokens += item.total_tokens;
    if (item.cost_usd !== undefined) current.cost_usd = (current.cost_usd ?? 0) + item.cost_usd;
    summaries.set(item.skill, current);
  }
  return [...summaries.values()].sort((left, right) => left.skill.localeCompare(right.skill));
}

export function formatUsageFooter(item: Pick<UsageRecord, 'agent' | 'skill' | 'input_tokens' | 'cached_input_tokens' | 'cache_creation_input_tokens' | 'output_tokens' | 'reasoning_tokens' | 'total_tokens' | 'cost_usd'>): string {
  const parts = [
    `${item.total_tokens} total`, `${item.input_tokens} input`, `${item.cached_input_tokens} cached input`,
    `${item.cache_creation_input_tokens} cache write`, `${item.output_tokens} output`, `${item.reasoning_tokens} reasoning`,
  ];
  if (item.cost_usd !== undefined) parts.push(`$${item.cost_usd.toFixed(6)}`);
  return `Token usage — ${item.skill} (${item.agent}): ${parts.join(' | ')}`;
}
