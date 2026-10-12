import { Search } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="border border-dashed border-[#C9C6BA] py-16 px-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F0EFE9] mb-4">
        <Search size={20} className="text-[#5B6476]" />
      </div>
      <p className="text-sm text-[#5B6476] max-w-sm mx-auto">
        Enter a company above to see how often it shows up when AI models like Claude and Perplexity answer real buyer questions.
      </p>
    </div>
  );
}