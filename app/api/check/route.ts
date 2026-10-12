/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from '@anthropic-ai/sdk';
import crmPrompts from '@/lib/prompts/crmPromptBank.json';
import { supabase } from '@/lib/supabase';
import { callPerplexity } from '@/lib/perplexity';

const anthropic = new Anthropic();
const CACHE_HOURS = 168;

type MentionResult = {
  category: string;
  mention_type: string;
  rank: number | null;
  sentiment: string;
  context: string;
  competitors_mentioned: string[];
};

// Batch schema: one tool call returns results for ALL categories at once
const batchExtractTool = {
  name: 'extract_mentions_batch',
  description: 'Record results for every category question that was asked, one entry per category.',
  input_schema: {
    type: 'object' as const,
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            mention_type: { type: 'string', enum: ['not_mentioned', 'mentioned', 'shortlisted', 'recommended', 'best_fit'] },
            rank: { type: ['number', 'null'] },
            sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
            context: { type: 'string' },
            competitors_mentioned: { type: 'array', items: { type: 'string' } },
          },
          required: ['category', 'mention_type', 'sentiment', 'context', 'competitors_mentioned'],
        },
      },
    },
    required: ['results'],
  },
};

function stripCitations(text: string): string {
  return text.replace(/<\/?cite[^>]*>/g, '').trim();
}

function normalizeResults(raw: any, categories: string[]): MentionResult[] {
  const items = Array.isArray(raw?.results) ? raw.results : [];
  return categories.map((cat) => {
    const match = items.find((r: any) => r.category === cat);
    return {
      category: cat,
      mention_type: match?.mention_type ?? 'not_mentioned',
      rank: match?.rank ?? null,
      sentiment: match?.sentiment ?? 'neutral',
      context: match?.context ? stripCitations(match.context) : 'No context provided',
      competitors_mentioned: match?.competitors_mentioned ?? [],
    };
  });
}

function getOnePerCategory(prompts: { id: string; category: string; text: string }[]) {
  const categories = [...new Set(prompts.map((p) => p.category))];

  return categories.map((category) => {
    const promptsInCategory = prompts.filter((p) => p.category === category);
    const randomIndex = Math.floor(Math.random() * promptsInCategory.length);
    return promptsInCategory[randomIndex];
  });
}

function buildCombinedQuestion(prompts: { category: string; text: string }[]) {
  return prompts
    .map((p, i) => `${i + 1}. [category: ${p.category}] ${p.text}`)
    .join('\n');
}

// Claude: search + batch extract in ONE call
async function checkWithClaude(prompts: { category: string; text: string }[], companyName: string): Promise<MentionResult[]> {
  const categories = prompts.map((p) => p.category);
  const combined = buildCombinedQuestion(prompts);

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }, batchExtractTool],
    tool_choice: { type: 'auto' },
    messages: [{
      role: 'user',
      content: `Search the web to answer each of these questions:\n${combined}\n\nFor each one, determine if "${companyName}" appears in your answer. Then call extract_mentions_batch ONCE with one entry per category (use the exact category labels given). Always include context and competitors_mentioned for every entry, even if not_mentioned.`,
    }],
  });

  const toolUse = message.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use' && c.name === 'extract_mentions_batch'
  );
  return normalizeResults(toolUse?.input, categories);
}

// Shared: batch-extract structured data from one combined text answer
async function extractBatchFromText(text: string, companyName: string, categories: string[]): Promise<MentionResult[]> {
  const result = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    tools: [batchExtractTool],
    tool_choice: { type: 'tool', name: 'extract_mentions_batch' },
    messages: [{
      role: 'user',
      content: `Given this answer covering multiple questions:\n"${text}"\n\nFor each category (${categories.join(', ')}), determine if "${companyName}" was mentioned in that part of the answer. Call extract_mentions_batch with one entry per category.`,
    }],
  });

  const toolUse = result.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use'
  );
  return normalizeResults(toolUse?.input, categories);
}

async function checkWithPerplexity(prompts: { category: string; text: string }[], companyName: string): Promise<MentionResult[]> {
  const categories = prompts.map((p) => p.category);
  const combined = buildCombinedQuestion(prompts);
  const text = await callPerplexity(`Answer each of these questions:\n${combined}`);
  return extractBatchFromText(text, companyName, categories);
}

// Check Supabase for a recent check before spending anything
async function getCachedResults(companyName: string) {
  const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('mentions')
    .select('*')
    .ilike('company_name', companyName)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Cache lookup error:', error);
    return null;
  }

  return data && data.length > 0 ? data : null;
}

export async function POST(request: Request) {
  try {
    const { companyName } = await request.json();
    if (!companyName) {
      return Response.json({ error: 'Missing companyName' }, { status: 400 });
    }

    //1. Check cache first — skip all API calls if we have a recent result
    const cached = await getCachedResults(companyName);
    if (cached) {
      return Response.json({ companyName, results: cached, fromCache: true });
    }

    // 2. No cache hit — run all 3 providers, each in ONE batched call
    const selectedPrompts = getOnePerCategory(crmPrompts);

    const [claudeResults, perplexityResults] = await Promise.all([
      checkWithClaude(selectedPrompts, companyName),
      checkWithPerplexity(selectedPrompts, companyName),
    ]);

    const allResults = [
      ...claudeResults.map((r) => ({ ...r, provider: 'claude' })),
      ...perplexityResults.map((r) => ({ ...r, provider: 'perplexity' })),
    ];

    // 3. Save to Supabase
    const rowsToInsert = allResults.map((r) => ({
      company_name: companyName,
      prompt_id: selectedPrompts.find((p) => p.category === r.category)?.id ?? r.category,
      category: r.category,
      provider: r.provider,
      mention_type: r.mention_type,
      rank: r.rank,
      sentiment: r.sentiment,
      context: r.context,
      competitors_mentioned: r.competitors_mentioned,
    }));

    const { error: insertError } = await supabase.from('mentions').insert(rowsToInsert);
    if (insertError) console.error('Supabase insert error:', insertError);

    return Response.json({ companyName, results: allResults + "\n\n", fromCache: false });
  } catch (error: any) {
    console.error(error);
    if (error?.status === 429) return Response.json({ error: 'Rate limited' }, { status: 429 });
    if (error?.status === 401) return Response.json({ error: 'Invalid API key' }, { status: 401 });
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}