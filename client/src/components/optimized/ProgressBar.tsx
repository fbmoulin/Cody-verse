import { memo } from 'react';
import type { ProgressBarProps } from '@/types';

const ProgressBar = memo<ProgressBarProps>(({ 
  progress, 
  total = 100, 
  showLabel = true, 
  size = 'md', 
  color = 'primary', 
  animated = false 
}) => {
  const percentage = Math.min(100, Math.max(0, (progress / total) * 100));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const colorClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClasses[color]} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;