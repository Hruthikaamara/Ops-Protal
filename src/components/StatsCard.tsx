import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; up: boolean };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600' },
  danger:  { bg: 'bg-red-50', text: 'text-red-600' },
};

export default function StatsCard({ label, value, icon, trend, color = 'primary' }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-5 flex items-start justify-between animate-slide-up">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.up
              ? <TrendingUp size={14} className="text-emerald-500" />
              : <TrendingDown size={14} className="text-red-500" />}
            <span className={`text-xs font-semibold ${trend.up ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>
        {icon}
      </div>
    </div>
  );
}
