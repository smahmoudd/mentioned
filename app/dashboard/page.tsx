'use client';

import { useState } from 'react';
import { ScoreData } from './types';
import ScoreCard from './components/ScoreCard';
import CategoryBreakdown from './components/CategoryBreakdown';
import ProviderBreakdown from './components/ProviderBreakdown';
import CompetitorTags from './components/CompetitorTags';
import EmptyState from './components/EmptyState';

export default function DashboardPage() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);

  async function runCheck() {
    if (!companyName.trim()) return;
    setLoading(true);
    setError(null);
    setScore(null);

    try {
      const checkRes = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });
      if (!checkRes.ok) throw new Error('Check failed');

      const scoreRes = await fetch(`/api/score?companyName=${encodeURIComponent(companyName)}`);
      if (!scoreRes.ok) throw new Error('Scoring failed');
      setScore(await scoreRes.json());
    } catch (err) {
      setError('Something went wrong. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-[#14213D] mb-2 tracking-tight">AI Visibility Check</h1>
        <p className="text-[#5B6476] mb-10 text-lg">
          See how often your company shows up in AI search results — and read exactly why.
        </p>

        <div className="flex gap-2 mb-12">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runCheck()}
            placeholder="Enter a company name"
            className="flex-1 px-4 py-3 border border-[#C9C6BA] bg-white text-[#14213D] placeholder:text-[#9B9688] focus:outline-none focus:border-[#0F766E] transition-colors"
          />
          <button
            onClick={runCheck}
            disabled={loading}
            className="px-6 py-3 bg-[#0F766E] text-white font-medium transition-colors hover:bg-[#0D5C56] disabled:bg-[#9B9688] disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {error && <p className="text-[#B91C1C] mb-6">{error}</p>}

        {!score && !loading && !error && <EmptyState />}

        {score && (
          <div className="space-y-6">
            <ScoreCard companyName={score.companyName} visibilityScore={score.visibilityScore} totalResults={score.totalResults} />
            <CategoryBreakdown data={score.categoryBreakdown} details={score.details} />
            <ProviderBreakdown data={score.providerBreakdown} />
            <CompetitorTags data={score.topCompetitors} />
          </div>
        )}
      </div>
    </main>
  );
}