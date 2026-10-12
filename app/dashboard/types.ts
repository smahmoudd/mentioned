export type CategoryBreakdown = { category: string; mentionRate: number; sampleSize: number };
export type ProviderBreakdown = { provider: string; mentionRate: number; sampleSize: number };
export type Competitor = { name: string; count: number };
export type Detail = { category: string; provider: string; mentionType: string; context: string };

export type ScoreData = {
  companyName: string;
  visibilityScore: number;
  totalResults: number;
  categoryBreakdown: CategoryBreakdown[];
  providerBreakdown: ProviderBreakdown[];
  topCompetitors: Competitor[];
  details: Detail[];
};

export const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  general_discovery: { label: 'General Discovery', description: 'Broad "best CRM" style questions, no specific angle' },
  use_case: { label: 'Use Case', description: 'Questions framed around a specific workflow or task' },
  industry_persona: { label: 'Industry / Persona', description: 'Questions from a specific type of buyer or industry' },
  features: { label: 'Features', description: 'Questions about specific capabilities or integrations' },
  pricing_value: { label: 'Pricing / Value', description: 'Questions where cost or affordability is the deciding factor' },
  switching_scaling: { label: 'Switching / Scaling', description: 'Questions about replacing a system or growing out of one' },
};

export const MENTION_LABELS: Record<string, string> = {
  not_mentioned: 'Not mentioned',
  mentioned: 'Mentioned',
  shortlisted: 'Shortlisted',
  recommended: 'Recommended',
  best_fit: 'Best fit',
};