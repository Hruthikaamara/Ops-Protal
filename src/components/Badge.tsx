interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
  children: React.ReactNode;
}

const variantMap = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger:  'bg-red-50 text-red-700 border border-red-200',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200',
  neutral: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge ${variantMap[variant]}`}>{children}</span>;
}
