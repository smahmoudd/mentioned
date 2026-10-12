import { supabase } from '@/lib/supabase';

type MentionRow = {
  category: string;
  provider: string;
  mention_type: string;
  competitors_mentioned: string[];
};

function mentionRate(rows: MentionRow[]) {
  if (rows.length === 0) return 0;
  const mentioned = rows.filter((r) => r.mention_type !== 'not_mentioned').length;
  return Math.round((mentioned / rows.length) * 100);
}

function groupBy(rows: MentionRow[], key: 'category' | 'provider') {
  const groups: Record<string, MentionRow[]> = {};
  for (const row of rows) {
    const k = row[key];
    if (!groups[k]) groups[k] = [];
    groups[k].push(row);
  }
  return groups;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('companyName');

    if (!companyName) {
      return Response.json({ error: 'Missing companyName query param' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('mentions')
      .select('category, provider, mention_type, competitors_mentioned')
      .eq('company_name', companyName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Score lookup error:', error);
      return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json({ error: 'No data found for this company. Run a check first.' }, { status: 404 });
    }

    const rows = data as MentionRow[];

    // Overall score
    const visibilityScore = mentionRate(rows);

    // Per-category breakdown
    const byCategory = groupBy(rows, 'category');
    const categoryBreakdown = Object.entries(byCategory).map(([category, categoryRows]) => ({
      category,
      mentionRate: mentionRate(categoryRows),
      sampleSize: categoryRows.length,
    }));

    // Per-provider breakdown
    const byProvider = groupBy(rows, 'provider');
    const providerBreakdown = Object.entries(byProvider).map(([provider, providerRows]) => ({
      provider,
      mentionRate: mentionRate(providerRows),
      sampleSize: providerRows.length,
    }));

    // Competitor tally
    const competitorCounts: Record<string, number> = {};
    for (const row of rows) {
      for (const competitor of row.competitors_mentioned ?? []) {
        competitorCounts[competitor] = (competitorCounts[competitor] ?? 0) + 1;
      }
    }
    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return Response.json({
      companyName,
      visibilityScore,
      totalResults: rows.length,
      categoryBreakdown,
      providerBreakdown,
      topCompetitors,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}