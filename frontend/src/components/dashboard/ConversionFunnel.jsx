import { useFunnel } from '../../hooks/useDashboard.js';
import { TrendingUp } from 'lucide-react';

const ConversionFunnel = () => {
  const { data, isLoading } = useFunnel();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const funnel = data?.data || {};
  const maxValue = Math.max(
    funnel.ingested || 0,
    funnel.scored || 0,
    funnel.responded || 0,
    funnel.testDrive || 0,
    funnel.converted || 0
  );

  const stages = [
    { label: 'Ingested', value: funnel.ingested || 0, color: 'bg-gray-900' },
    { label: 'AI Scored', value: funnel.scored || 0, color: 'bg-gray-600' },
    { label: 'Responded', value: funnel.responded || 0, color: 'bg-accent' },
    { label: 'Test Drive', value: funnel.testDrive || 0, color: 'bg-gray-400' },
    { label: 'Converted', value: funnel.converted || 0, color: 'bg-green-600' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Conversion Funnel
        </h3>
        <span className="text-sm text-gray-600">This month</span>
      </div>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                <span className="text-sm font-bold text-gray-900">{stage.value}</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} transition-all duration-500`}
                  style={{ width: `${width}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversionFunnel;
