const KPICard = ({ title, value, trend, icon: Icon, color = 'accent' }) => {
  const colorClasses = {
    accent: 'bg-accent-light border-accent-border text-accent',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`border rounded-lg p-5 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        {Icon && <Icon className="w-6 h-6" />}
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium opacity-80">{title}</div>
    </div>
  );
};

export default KPICard;
