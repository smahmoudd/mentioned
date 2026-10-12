type Props = { companyName: string; visibilityScore: number; totalResults: number };

export default function ScoreCard({ companyName, visibilityScore, totalResults }: Props) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (visibilityScore / 100) * circumference;

  return (
    <div className="border border-[#E2E0D8] bg-white p-8 flex items-center gap-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#F0EFE9" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#0F766E"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-[#14213D] tabular-nums">{visibilityScore}%</span>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-[#5B6476] mb-1">Visibility score</p>
        <p className="text-2xl font-bold text-[#14213D] mb-2">{companyName}</p>
        <p className="text-sm text-[#5B6476]">
          Mentioned in <span className="font-medium text-[#14213D]">{Math.round((visibilityScore / 100) * totalResults)}</span> of{' '}
          <span className="font-medium text-[#14213D]">{totalResults}</span> AI responses checked
        </p>
      </div>
    </div>
  );
}