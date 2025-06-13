import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { StatCardProps } from '@/types';

const StatCard = memo<StatCardProps>(({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'primary' 
}) => {
  const colorClasses = {
    primary: 'border-blue-200 bg-blue-50 text-blue-700',
    secondary: 'border-gray-200 bg-gray-50 text-gray-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    error: 'border-red-200 bg-red-50 text-red-700'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-red-500" />,
    neutral: <Minus className="w-4 h-4 text-gray-500" />
  };

  return (
    <div className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center mt-2 text-sm">
              {trendIcons[trend]}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 opacity-75">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;