import { Competitor } from '../types';

type Props = { data: Competitor[] };

export default function CompetitorTags({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="border border-[#E2E0D8] bg-white p-6">
      <h2 className="font-semibold text-[#14213D] mb-4">Frequently mentioned alongside</h2>
      <div className="flex flex-wrap gap-2">
        {data.map((c) => (
          <span key={c.name} className="px-3 py-1 border border-[#E2E0D8] text-sm text-[#14213D]">
            {c.name} <span className="text-[#5B6476]">({c.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}