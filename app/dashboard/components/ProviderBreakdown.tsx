import { ProviderBreakdown as ProviderData } from '../types';

type Props = { data: ProviderData[] };

export default function ProviderBreakdown({ data }: Props) {
  const appearsIn = data.filter((p) => p.mentionRate > 0).map((p) => p.provider);
  const missingFrom = data.filter((p) => p.mentionRate === 0).map((p) => p.provider);

  return (
    <div className="border border-[#E2E0D8] bg-white p-6">
      <h2 className="font-semibold text-[#14213D] mb-4">AI providers</h2>

      {appearsIn.length > 0 && (
        <p className="text-sm text-[#14213D] mb-1">
          <span className="text-[#0F766E] font-medium">Appears in:</span> {appearsIn.join(', ')}
        </p>
      )}

      {missingFrom.length > 0 && (
        <p className="text-sm text-[#5B6476]">
          <span className="font-medium">Not appearing in:</span> {missingFrom.join(', ')}
        </p>
      )}
    </div>
  );
}