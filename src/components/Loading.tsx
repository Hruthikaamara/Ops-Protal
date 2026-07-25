import { Loader2 } from 'lucide-react';

export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Loader2 size={28} className="animate-spin mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
