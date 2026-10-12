'use client';

import { useState } from 'react';
import { CategoryBreakdown as CategoryData, Detail, CATEGORY_INFO, MENTION_LABELS } from '../types';

type Props = { data: CategoryData[]; details: Detail[] };

export default function CategoryBreakdown({ data, details }: Props) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div className="border border-[#E2E0D8] bg-white p-6">
      <h2 className="font-semibold text-[#14213D] mb-1">By category</h2>
      <p className="text-sm text-[#5B6476] mb-4">Click a category to see the actual AI responses behind the number.</p>

      <div className="space-y-4">
        {data.map((c) => {
          const info = CATEGORY_INFO[c.category];
          const isOpen = openCategory === c.category;
          const evidence = details.filter((d) => d.category === c.category);

          return (
            <div key={c.category} className="border-t border-[#E2E0D8] pt-4 first:border-t-0 first:pt-0">
              <button
                onClick={() => setOpenCategory(isOpen ? null : c.category)}
                className="w-full text-left"
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#14213D] font-medium">{info?.label ?? c.category}</span>
                  <span className="text-[#5B6476] tabular-nums">{c.mentionRate}%</span>
                </div>
                <p className="text-xs text-[#5B6476] mb-2">{info?.description}</p>
                <div className="w-full bg-[#F0EFE9] h-1.5">
                  <div className="bg-[#0F766E] h-1.5" style={{ width: `${c.mentionRate}%` }} />
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2">
                  {evidence.map((e, i) => (
                    <div key={i} className="bg-[#FAFAF7] border border-[#E2E0D8] p-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs uppercase tracking-wide text-[#B45309] font-medium">{e.provider}</span>
                        <span className="text-xs text-[#5B6476]">{MENTION_LABELS[e.mentionType] ?? e.mentionType}</span>
                      </div>
                      <p className="text-[#14213D]">{e.context}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}