'use client';

import Card from '../../ui/Card';

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  description = '',
  onClick = null 
}) {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600'
  };

  const CardComponent = onClick ? 'button' : 'div';
  const cardProps = onClick ? { onClick } : {};

  return (
    <CardComponent
      {...cardProps}
      className={`w-full ${onClick ? 'cursor-pointer transform hover:scale-105 transition-all duration-200' : ''}`}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {title}
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {value}
            </p>
            {description && (
              <p className="text-sm text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-white text-2xl`}>
            {icon}
          </div>
        </div>
      </Card>
    </CardComponent>
  );
} 