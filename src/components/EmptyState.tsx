import { Inbox } from 'lucide-react';

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-gray-50 mb-4">
        <Inbox size={32} className="text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
