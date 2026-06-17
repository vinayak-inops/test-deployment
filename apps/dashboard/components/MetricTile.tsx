import { LucideIcon } from 'lucide-react';

interface MetricTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  formula?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-700',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-700',
    trend: 'text-emerald-600',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500',
    text: 'text-orange-700',
    trend: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500',
    text: 'text-red-700',
    trend: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-700',
    trend: 'text-purple-600',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'bg-teal-500',
    text: 'text-teal-700',
    trend: 'text-teal-600',
  },
};

export function MetricTile({ title, value, subtitle, formula, icon: Icon, trend, color }: MetricTileProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`${colors.icon} rounded-lg p-2.5`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
            {formula && (
              <div className="mt-2 p-2 bg-slate-50 rounded border-l-2 border-blue-400">
                <p className="text-xs font-semibold text-slate-600">Formula:</p>
                <p className="text-xs text-slate-700">{formula}</p>
              </div>
            )}
          </div>

          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.positive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
